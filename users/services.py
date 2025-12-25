from datetime import date, datetime, timedelta
from django.db import transaction
from django.utils import timezone
from .models import ReadingProgress, ReadingStreak, Achievement, UserAchievement


class AchievementService:
    
    @staticmethod
    def update_reading_streak(user):
        """Update user's reading streak based on their reading progress."""
        today = timezone.now().date()
        
        # Get or create reading streak
        streak, created = ReadingStreak.objects.get_or_create(
            user=user,
            defaults={
                'current_streak': 0,
                'longest_streak': 0,
                'last_read_date': None
            }
        )
        
        # Get today's reading progress
        today_progress = ReadingProgress.objects.filter(
            user=user,
            completed=True,
            last_read_at__date=today
        ).exists()
        
        if today_progress:
            if streak.last_read_date == today - timedelta(days=1):
                # Continue streak
                streak.current_streak += 1
            elif streak.last_read_date != today:
                # Start new streak
                streak.current_streak = 1
            # else: already updated today, no change
            
            # Update longest streak
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
            
            streak.last_read_date = today
            streak.save()
            
            # Check for streak achievements
            AchievementService._check_streak_achievements(user, streak)
        
        return streak
    
    @staticmethod
    def _check_streak_achievements(user, streak):
        """Check and award streak-based achievements."""
        achievement_criteria = {
            'Week Reader': 7,
            'Month Reader': 30,
            'Quarter Reader': 90,
            'Half Year Reader': 180,
            'Year Reader': 365,
            'Super Reader': 100
        }
        
        for achievement_name, required_days in achievement_criteria.items():
            if streak.current_streak >= required_days:
                achievement, created = Achievement.objects.get_or_create(
                    name=achievement_name,
                    defaults={
                        'description': f'Read for {required_days} consecutive days!',
                        'image_url': f'/images/achievements/streak_{required_days}.png'
                    }
                )
                
                UserAchievement.objects.get_or_create(
                    user=user,
                    achievement=achievement
                )
    
    @staticmethod
    def award_content_achievement(user, content_type):
        """Award achievements based on content consumption."""
        # Get count of completed content by type
        completed_count = ReadingProgress.objects.filter(
            user=user,
            completed=True
        ).count()
        
        achievement_criteria = {
            'First Article': 1,
            'Curious Reader': 10,
            'Knowledge Seeker': 50,
            'Book Worm': 100,
            'Master Reader': 500,
            'Legendary Reader': 1000
        }
        
        for achievement_name, required_count in achievement_criteria.items():
            if completed_count >= required_count:
                achievement, created = Achievement.objects.get_or_create(
                    name=achievement_name,
                    defaults={
                        'description': f'Read {required_count} articles!',
                        'image_url': f'/images/achievements/content_{required_count}.png'
                    }
                )
                
                UserAchievement.objects.get_or_create(
                    user=user,
                    achievement=achievement
                )
    
    @staticmethod
    def mark_content_complete(user, news_event):
        """Mark content as complete and trigger achievement checks."""
        progress, created = ReadingProgress.objects.get_or_create(
            user=user,
            news_event=news_event,
            defaults={'completed': True}
        )
        
        if not created and not progress.completed:
            progress.completed = True
            progress.save()
        
        # Only trigger checks if newly completed
        if created or (not created and progress.completed):
            AchievementService.update_reading_streak(user)
            AchievementService.award_content_achievement(user, 'article')
    
    @staticmethod
    def get_user_achievements(user):
        """Get all achievements for a user with metadata."""
        user_achievements = UserAchievement.objects.filter(user=user).select_related('achievement')
        
        achievements_data = []
        for user_achievement in user_achievements:
            achievements_data.append({
                'id': user_achievement.achievement.id,
                'name': user_achievement.achievement.name,
                'description': user_achievement.achievement.description,
                'image_url': user_achievement.achievement.image_url,
                'achieved_at': user_achievement.achieved_at
            })
        
        return achievements_data
    
    @staticmethod
    def get_all_available_achievements():
        """Get all available achievements in the system."""
        return Achievement.objects.all().order_by('name')