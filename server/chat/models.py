from django.db import models
from django.contrib.auth.models import User
import uuid

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default='active')
    summary = models.TextField(blank=True, null=True)
    key_points = models.JSONField(blank=True, null=True)
    insights = models.TextField(blank=True, null=True)
    share_token = models.CharField(max_length=64, blank=True, null=True, unique=True)
    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=[('user', 'User'), ('ai', 'AI')])
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_bookmarked = models.BooleanField(default=False)
    reactions = models.JSONField(blank=True, null=True, default=list)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='branches')
    branch_name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.sender}: {self.content[:30]}"
