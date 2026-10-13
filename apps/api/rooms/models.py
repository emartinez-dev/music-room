from django.db import models


class Room(models.Model):
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
    ]

    name = models.CharField(max_length=255)
    host = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="hosted_rooms")
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="public")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class RoomMember(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="room_memberships")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("room", "user")

    def __str__(self):
        return f"{self.user.email} in {self.room.name}"


class RoomTrack(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="tracks")
    track = models.ForeignKey("tracks.Track", on_delete=models.CASCADE)
    added_by = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("room", "track")

    def __str__(self):
        return f"{self.track.name} in {self.room.name}"
