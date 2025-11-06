from django.contrib import admin
from django.urls import path, include
from chat.auth_views import register, login_view, logout_view, current_user
from chat.csrf_views import get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chat.urls')),
    path('api/auth/register/', register, name='register'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/user/', current_user, name='current_user'),
    path('api/auth/csrf/', get_csrf_token, name='csrf_token'),
]
