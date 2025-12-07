# WinkAI Setting Panel Guide

The **Settings Panel** is the central configuration hub for WinkAI. It allows users to manage AI providers, API keys, models, and general application preferences.

## Accessing the Panel
Click the **Settings (gear icon)** button located at the bottom of the left sidebar.

## Key Features

### 1. Provider Configuration
Manage connections to various AI services.

*   **Supported Providers**:
    *   **OpenAI**: Standard GPT models.
    *   **Anthropic**: Claude models.
    *   **Google (AI Studio)**: Gemini models via free/paid API keys.
    *   **Google Vertex AI**: Enterprise-grade access to Gemini, Imagen, and **Veo** (Video generation).
    *   **Custom**: Connect to any OpenAI-compatible endpoint (e.g., LocalLLM, Ollama, Azure OpenAI).

*   **API Key Management**:
    *   Enter and securely store API keys for each provider.
    *   **Test Connection**: Verify if your API key works and automatically fetch the list of available models.

### 2. Vertex AI Specifics
Special configuration for Google Cloud Vertex AI users.

*   **Project ID**: Your Google Cloud Project ID.
*   **Region**: The GCP region (e.g., `us-central1` is recommended for Veo/Imagen).
*   **Authentication**:
    *   **API Key (Recommended)**: Use a standard API Key (starts with `AIza...` or similar) for simplest setup.
    *   **OAuth**: Sign in with your Google Account for temporary tokens.

### 3. General Settings
Customize the chat experience.

*   **Language**: Switch UI language (English / Chinese).
*   **Temperature**: Control randomness (Creative vs. Precise).
*   **Max Tokens**: Set the limit for response length.
*   **Stream Responses**: Toggle typewriter-style output.
*   **Thinking Mode**: Enable/disable internal reasoning display for supported models.
*   **Auto-save History**: Automatically save chat sessions to local storage.

## Troubleshooting
*   **Connection Failed**: Use the "Test Connection" button to diagnose API key or network issues.
*   **CORS Issues**: If using the Web version, configure a CORS Proxy URL in the Custom provider settings.
