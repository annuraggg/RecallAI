from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from django.utils import timezone
from django.utils.html import escape
from django.http import HttpResponse
import google.generativeai as genai
from django.conf import settings
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import functools
import logging
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from io import BytesIO
import markdown

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

executor = ThreadPoolExecutor(max_workers=5)

def timeout_handler(timeout_seconds):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            future = executor.submit(func, *args, **kwargs)
            try:
                return future.result(timeout=timeout_seconds)
            except TimeoutError:
                raise Exception(f"Request timed out after {timeout_seconds} seconds")
        return wrapper
    return decorator


class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all().order_by('-start_time')
    serializer_class = ConversationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(user=self.request.user)
        if self.action == 'list':
            show_archived = self.request.query_params.get('show_archived', 'false').lower() == 'true'
            if not show_archived:
                queryset = queryset.filter(is_archived=False)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def _generate_ai_response(self, prompt):
        @timeout_handler(30)
        def get_response():
            return model.generate_content(prompt).text.strip()
        
        try:
            response = get_response()
            return {"success": True, "content": response}
        except Exception as e:
            logger.error(f"AI response generation failed: {str(e)}", exc_info=True)
            error_msg = "I apologize, but I'm having trouble connecting to the AI service. Please check your GEMINI_API_KEY configuration or try again later."
            return {"success": False, "content": error_msg}

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):

        print("send_message called")
        conversation = self.get_object()
        user_message = request.data.get('content')
        
        if not user_message or not user_message.strip():
            print("Empty message received")
            return Response(
                {"error": "Message content is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        Message.objects.create(
            conversation=conversation,
            sender='user',
            content=user_message
        )

        context = "\n".join(
            [f"{m.sender}: {m.content}" for m in conversation.messages.all()]
        )

        prompt = f"Conversation so far:\n{context}\nUser: {user_message}\nAI:"

        result = self._generate_ai_response(prompt)
        
        ai_content = result["content"]
        ai_content_stripped = ai_content.lstrip()
        if ai_content_stripped.lower().startswith("ai:"):
            colon_index = ai_content_stripped.lower().index(":") + 1
            ai_content = ai_content_stripped[colon_index:].lstrip()

        Message.objects.create(
            conversation=conversation,
            sender='ai',
            content=ai_content
        )

        return Response({
            "user_message": user_message,
            "ai_response": ai_content
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        conversation = self.get_object()
        conversation.end_time = timezone.now()
        conversation.status = 'ended'

        full_text = "\n".join([m.content for m in conversation.messages.all()])
        
        summary_prompt = f"Summarize this conversation briefly:\n{full_text}"
        result = self._generate_ai_response(summary_prompt)
        summary = result["content"] if result["success"] else "Summary generation failed."
        
        key_points_prompt = f"Extract 3-5 key points from this conversation as a JSON array of strings:\n{full_text}"
        key_points_result = self._generate_ai_response(key_points_prompt)
        if key_points_result["success"]:
            try:
                import json as json_module
                key_points = json_module.loads(key_points_result["content"])
            except (json_module.JSONDecodeError, ValueError, TypeError):
                key_points = [key_points_result["content"]]
        else:
            key_points = []
        
        insights_prompt = f"Provide insights and analysis from this conversation:\n{full_text}"
        insights_result = self._generate_ai_response(insights_prompt)
        insights = insights_result["content"] if insights_result["success"] else ""
        
        conversation.summary = summary
        conversation.key_points = key_points
        conversation.insights = insights
        conversation.save()

        Message.objects.create(
            conversation=conversation,
            sender='ai',
            content=f"**Conversation Summary**\n\n{summary}"
        )

        return Response({
            "message": "Conversation ended",
            "summary": summary,
            "key_points": key_points,
            "insights": insights
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def query(self, request):
        query_text = request.data.get('query')

        all_conversations = Conversation.objects.filter(user=request.user)
        combined = "\n\n".join(
            [f"Conversation {c.id}: {c.summary or 'No summary'}" for c in all_conversations]
        )

        prompt = f"Here are summaries of past conversations:\n{combined}\nUser query: {query_text}\nAnswer based on these summaries."

        result = self._generate_ai_response(prompt)
        return Response({"query": query_text, "response": result["content"]})

    @action(detail=True, methods=['get'])
    def suggestions(self, request, pk=None):
        conversation = self.get_object()
        recent_messages = conversation.messages.all().order_by('-timestamp')[:5]
        context = "\n".join([f"{m.sender}: {m.content}" for m in reversed(recent_messages)])
        
        prompt = f"Based on this conversation context, suggest 3 helpful follow-up questions or topics as a JSON array:\n{context}"
        result = self._generate_ai_response(prompt)
        
        if result["success"]:
            try:
                import json as json_module
                suggestions = json_module.loads(result["content"])
            except (json_module.JSONDecodeError, ValueError, TypeError):
                suggestions = ["Tell me more", "What else?", "Can you explain further?"]
        else:
            suggestions = ["Tell me more", "What else?", "Can you explain further?"]
        
        return Response({"suggestions": suggestions})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_archived = not conversation.is_archived
        conversation.save()
        return Response({
            "is_archived": conversation.is_archived
        })

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        import secrets
        conversation = self.get_object()
        
        if not conversation.share_token:
            conversation.share_token = secrets.token_urlsafe(32)
            conversation.save()
        
        return Response({
            "share_token": conversation.share_token,
            "share_url": f"/shared/{conversation.share_token}"
        })

    @action(detail=False, methods=['get'], url_path='shared/(?P<token>[^/.]+)', permission_classes=[AllowAny])
    def get_shared(self, request, token=None):
        try:
            conversation = Conversation.objects.get(share_token=token)
            serializer = self.get_serializer(conversation)
            return Response(serializer.data)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        conversation = self.get_object()
        export_format = request.query_params.get('format', 'json')
        
        if export_format == 'pdf':
            return self._export_pdf(conversation)
        elif export_format == 'markdown':
            return self._export_markdown(conversation)
        else:
            return self._export_json(conversation)
    
    def _export_json(self, conversation):
        data = {
            'id': conversation.id,
            'title': conversation.title,
            'start_time': conversation.start_time.isoformat(),
            'end_time': conversation.end_time.isoformat() if conversation.end_time else None,
            'status': conversation.status,
            'summary': conversation.summary,
            'key_points': conversation.key_points,
            'messages': [
                {
                    'sender': m.sender,
                    'content': m.content,
                    'timestamp': m.timestamp.isoformat()
                }
                for m in conversation.messages.all()
            ]
        }
        response = HttpResponse(
            json.dumps(data, indent=2, default=str),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="conversation_{conversation.id}.json"'
        return response
    
    def _export_markdown(self, conversation):
        content = f"# {conversation.title}\n\n"
        content += f"**Start Time:** {conversation.start_time}\n\n"
        if conversation.end_time:
            content += f"**End Time:** {conversation.end_time}\n\n"
        
        if conversation.summary:
            content += f"## Summary\n\n{conversation.summary}\n\n"
        
        content += "## Messages\n\n"
        for message in conversation.messages.all():
            sender_label = "**User:**" if message.sender == "user" else "**AI:**"
            content += f"{sender_label}\n\n{message.content}\n\n---\n\n"
        
        response = HttpResponse(content, content_type='text/markdown')
        response['Content-Disposition'] = f'attachment; filename="conversation_{conversation.id}.md"'
        return response
    
    def _export_pdf(self, conversation):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
        )
        story.append(Paragraph(conversation.title, title_style))
        story.append(Spacer(1, 0.2*inch))
        
        info_style = styles['Normal']
        story.append(Paragraph(f"<b>Start Time:</b> {conversation.start_time}", info_style))
        if conversation.end_time:
            story.append(Paragraph(f"<b>End Time:</b> {conversation.end_time}", info_style))
        story.append(Spacer(1, 0.3*inch))
        
        if conversation.summary:
            story.append(Paragraph("<b>Summary</b>", styles['Heading2']))
            story.append(Paragraph(conversation.summary, info_style))
            story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph("<b>Messages</b>", styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        for message in conversation.messages.all():
            sender_style = ParagraphStyle(
                'Sender',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=12,
            )
            story.append(Paragraph(f"{message.sender.upper()}:", sender_style))
            
            content_clean = escape(message.content)
            story.append(Paragraph(content_clean, info_style))
            story.append(Spacer(1, 0.2*inch))
        
        doc.build(story)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="conversation_{conversation.id}.pdf"'
        return response
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        from django.db.models import Count, Avg
        from django.db.models.functions import TruncDate
        from datetime import timedelta
        from django.utils import timezone
        
        user_conversations = Conversation.objects.filter(user=request.user)
        user_messages = Message.objects.filter(conversation__user=request.user)
        
        conversations_by_date = user_conversations.annotate(
            date=TruncDate('start_time')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('-date')[:30]
        
        total_conversations = user_conversations.count()
        total_messages = user_messages.count()
        active_conversations = user_conversations.filter(status='active').count()
        ended_conversations = user_conversations.filter(status='ended').count()
        archived_conversations = user_conversations.filter(is_archived=True).count()
        
        avg_messages_per_conversation = total_messages / total_conversations if total_conversations > 0 else 0
        
        now = timezone.now()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        
        conversations_last_7_days = user_conversations.filter(start_time__gte=last_7_days).count()
        conversations_last_30_days = user_conversations.filter(start_time__gte=last_30_days).count()
        messages_last_7_days = user_messages.filter(timestamp__gte=last_7_days).count()
        
        bookmarked_messages_count = user_messages.filter(is_bookmarked=True).count()
        
        user_message_count = user_messages.filter(sender='user').count()
        ai_message_count = user_messages.filter(sender='ai').count()
        
        conversations_with_summaries = user_conversations.exclude(summary__isnull=True).exclude(summary='').count()
        
        return Response({
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'active_conversations': active_conversations,
            'ended_conversations': ended_conversations,
            'archived_conversations': archived_conversations,
            'avg_messages_per_conversation': round(avg_messages_per_conversation, 2),
            'conversations_last_7_days': conversations_last_7_days,
            'conversations_last_30_days': conversations_last_30_days,
            'messages_last_7_days': messages_last_7_days,
            'bookmarked_messages_count': bookmarked_messages_count,
            'user_message_count': user_message_count,
            'ai_message_count': ai_message_count,
            'conversations_with_summaries': conversations_with_summaries,
            'conversations_by_date': list(conversations_by_date)
        })


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    @action(detail=True, methods=['post'])
    def bookmark(self, request, pk=None):
        message = self.get_object()
        message.is_bookmarked = not message.is_bookmarked
        message.save()
        return Response({"is_bookmarked": message.is_bookmarked})

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        message = self.get_object()
        reaction = request.data.get('reaction')
        
        if not message.reactions:
            message.reactions = []
        
        if reaction in message.reactions:
            message.reactions.remove(reaction)
        else:
            message.reactions.clear()
            message.reactions.append(reaction)
        
        message.save()
        return Response({"reactions": message.reactions})
    
    @action(detail=False, methods=['get'])
    def bookmarked(self, request):
        user_conversations = Conversation.objects.filter(user=request.user)
        bookmarked_messages = Message.objects.filter(
            conversation__in=user_conversations,
            is_bookmarked=True
        ).order_by('-timestamp')
        serializer = self.get_serializer(bookmarked_messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def branch(self, request, pk=None):
        parent_message = self.get_object()
        content = request.data.get('content')
        branch_name = request.data.get('branch_name', 'Alternative response')
        
        branch_message = Message.objects.create(
            conversation=parent_message.conversation,
            sender=parent_message.sender,
            content=content,
            parent=parent_message,
            branch_name=branch_name
        )
        
        serializer = self.get_serializer(branch_message)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def get_branches(self, request, pk=None):
        message = self.get_object()
        branches = message.branches.all()
        serializer = self.get_serializer(branches, many=True)
        return Response(serializer.data)
