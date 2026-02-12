from rest_framework import serializers
from .models import Quiz, Question, QuizSubmission, QuizAnswer


class QuestionListSerializer(serializers.ModelSerializer):
    """Serializer for displaying questions - excludes correct_answer to prevent cheating."""
    class Meta:
        model = Question
        fields = (
            'id',
            'quiz',
            'text',
            'options',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )


class QuestionDetailSerializer(serializers.ModelSerializer):
    """Serializer that includes correct_answer - only used in submission results."""
    class Meta:
        model = Question
        fields = (
            'id',
            'quiz',
            'text',
            'options',
            'correct_answer',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )


class QuizListSerializer(serializers.ModelSerializer):
    """Serializer for quiz listing/detail - uses QuestionListSerializer (no answers)."""
    questions = QuestionListSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = (
            'id',
            'monthly_book',
            'title',
            'questions',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )


class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ('question', 'selected_answer')


class QuizAnswerResultSerializer(serializers.ModelSerializer):
    """Serializer for quiz answer results - includes correct_answer for review."""
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)
    question_text = serializers.CharField(source='question.text', read_only=True)

    class Meta:
        model = QuizAnswer
        fields = ('question', 'question_text', 'selected_answer', 'is_correct', 'correct_answer')


class QuizSubmissionSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True)

    class Meta:
        model = QuizSubmission
        fields = ('id', 'quiz', 'answers', 'score', 'total_questions', 'completed_at')
        read_only_fields = ('id', 'score', 'total_questions', 'completed_at')

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        user = self.context['request'].user
        quiz = validated_data['quiz']

        # Check if user has already submitted this quiz
        if QuizSubmission.objects.filter(user=user, quiz=quiz).exists():
            raise serializers.ValidationError("You have already submitted this quiz.")

        submission = QuizSubmission.objects.create(user=user, **validated_data)
        total_questions = quiz.questions.count()
        correct_count = 0

        for answer_data in answers_data:
            question = answer_data['question']
            selected_answer = answer_data['selected_answer']
            is_correct = question.correct_answer == selected_answer

            QuizAnswer.objects.create(
                submission=submission,
                question=question,
                selected_answer=selected_answer,
                is_correct=is_correct
            )

            if is_correct:
                correct_count += 1

        submission.score = correct_count
        submission.total_questions = total_questions
        submission.save()

        return submission


class QuizSubmissionResultSerializer(serializers.ModelSerializer):
    """Serializer for submission results - includes correct answers for review."""
    answers = QuizAnswerResultSerializer(many=True, read_only=True)

    class Meta:
        model = QuizSubmission
        fields = ('id', 'quiz', 'answers', 'score', 'total_questions', 'completed_at')
        read_only_fields = ('id', 'score', 'total_questions', 'completed_at')
