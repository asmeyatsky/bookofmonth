import os
import requests
import base64
import uuid
from typing import Dict, Any
from content_pipeline.domain.ports.image_generation_port import ImageGenerationPort

class ImageGenerationAdapter(ImageGenerationPort):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key not provided or set in environment.")
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
        self.image_dir = "generated_images"
        os.makedirs(self.image_dir, exist_ok=True)

    def generate_image(self, prompt: str, style: str = "child-friendly, educational") -> Dict[str, Any]:
        full_prompt = f"Generate an image in a {style} style of: {prompt}"
        
        headers = {
            "Content-Type": "application/json",
        }
        
        data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": full_prompt
                        }
                    ]
                }
            ]
        }
        
        params = {
            "key": self.api_key
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=data, params=params)
            response.raise_for_status()
            
            response_json = response.json()
            
            # Extract base64 image data
            if "candidates" in response_json and len(response_json["candidates"]) > 0:
                content_parts = response_json["candidates"][0].get("content", {}).get("parts", [])
                image_data_part = next((part for part in content_parts if "inlineData" in part), None)
                
                if image_data_part:
                    image_data = image_data_part["inlineData"]["data"]
                    image_bytes = base64.b64decode(image_data)
                    
                    # Save image to file
                    image_filename = f"{uuid.uuid4()}.png"
                    image_path = os.path.join(self.image_dir, image_filename)
                    
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                    
                    return {
                        "image_path": image_path, # Return the local file path
                        "metadata": {
                            "prompt": full_prompt,
                            "style": style,
                        }
                    }

            # If no image data is found
            return {
                "image_path": None,
                "metadata": {
                    "prompt": full_prompt,
                    "style": style,
                    "error": "No image data found in API response",
                    "api_response": response_json
                }
            }

        except requests.exceptions.RequestException as e:
            print(f"Error calling Gemini API: {e}")
            return {
                "image_path": None,
                "metadata": {
                    "prompt": full_prompt,
                    "style": style,
                    "error": str(e)
                }
            }
        except (KeyError, IndexError, base64.binascii.Error) as e:
            print(f"Error processing Gemini API response: {e}")
            return {
                "image_path": None,
                "metadata": {
                    "prompt": full_prompt,
                    "style": style,
                    "error": f"Failed to decode or save image: {e}",
                    "api_response": response.json() if 'response' in locals() else 'No response'
                }
            }
