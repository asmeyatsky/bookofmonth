import os
import unittest
import requests
from unittest.mock import patch, MagicMock
from content_pipeline.infrastructure.adapters.image_generation_adapter import ImageGenerationAdapter

class TestImageGenerationAdapter(unittest.TestCase):

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_api_key"})
    @patch("requests.post")
    def test_generate_image_success(self, mock_post):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "This is a mock response from Gemini"
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        adapter = ImageGenerationAdapter()
        prompt = "A picture of a cat"
        style = "cartoon"

        # Act
        result = adapter.generate_image(prompt, style)

        # Assert
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(kwargs['params']['key'], 'test_api_key')
        self.assertIn(prompt, kwargs['json']['contents'][0]['parts'][0]['text'])
        self.assertIn(style, kwargs['json']['contents'][0]['parts'][0]['text'])
        self.assertIsNotNone(result)
        self.assertEqual(result['image_url'], f"https://picsum.photos/seed/{hash(prompt)}/800/600")

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_api_key"})
    @patch("requests.post")
    def test_generate_image_api_error(self, mock_post):
        # Arrange
        mock_post.side_effect = requests.exceptions.RequestException("API is down")

        adapter = ImageGenerationAdapter()
        prompt = "A picture of a dog"
        style = "realistic"

        # Act
        result = adapter.generate_image(prompt, style)

        # Assert
        self.assertIsNotNone(result)
        self.assertIsNone(result['image_url'])
        self.assertIn("error", result['metadata'])

    def test_missing_api_key(self):
        # Arrange
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        # Act & Assert
        with self.assertRaises(ValueError):
            ImageGenerationAdapter()

if __name__ == '__main__':
    unittest.main()
