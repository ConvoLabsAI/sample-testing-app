from django.urls import path
from myapp.Kokoro82M.views import handle_audio  # Import the view

urlpatterns = [
    # Route for handling audio files
    path('handle-audio/', handle_audio, name='handle_audio'),
]