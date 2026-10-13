from django.db import models


class Track(models.Model):
    spotify_uri = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=255)
    duration_ms = models.IntegerField()
    image_url = models.URLField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.artist}"
