/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Safely get the API key from Vite's environment variables.
// FIX: Cast `import.meta` to `any` to access the `env` property. Vite exposes environment variables
// on `import.meta.env`, but TypeScript doesn't know about it without proper configuration
// (e.g., including `vite/client` in tsconfig).
const API_KEY = (import.meta as any).env.VITE_API_KEY;

let ai: GoogleGenAI | null;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    ai = null;
    // Log an error to the console for developers. The user will see a UI error on API call.
    console.error("API key not found. Please set the VITE_API_KEY environment variable.");
}

/**
 * Checks if the GoogleGenAI instance is initialized.
 * @returns The initialized GoogleGenAI instance.
 * @throws An error if the instance is not initialized.
 */
const getInitializedAi = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("Gemini API is not initialized. Make sure the API_KEY environment variable is set.");
    }
    return ai;
};

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const model = 'gemini-2.5-flash-image-preview';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const ai = getInitializedAi();
    const userImagePart = await fileToPart(userImage);
    const prompt = `You are a world-class AI photo editor specializing in photorealistic transformations. Edit the provided image according to these extremely precise, NON-NEGOTIABLE instructions. The final result must be seamless and realistic.

**Core Objective:** Transform the subject into an athletic version of themselves in a new pose and with professional studio lighting, while perfectly preserving their identity and the original environment's style.

**Detailed Instructions (ALL ARE CRITICAL):**

1.  **Abdomen Visibility (Absolute Mandate):** This is the most critical rule. Under ALL circumstances, a significant portion of the subject's abdomen MUST be clearly visible. This rule supersedes all other clothing or posing instructions if they conflict. If clothing covers the stomach, it MUST be cropped. If a pose would hide the stomach, the pose MUST be adjusted. This is a NON-NEGOTIABLE requirement.

2.  **Identity Preservation (Highest Priority):** You MUST NOT alter the subject's face, hair style, hair color, or unique facial features in any way. Their identity from the original photo must be perfectly and flawlessly maintained. This is a strict requirement.

3.  **Pose Transformation (Subtle & Natural):**
    *   Change the subject's pose to a natural **"3/4 view"**.
    *   The subject must be slightly turned. **One leg should be bent *very slightly* to break a stiff stance, with the foot only minimally raised from the ground. The bend must be subtle and look completely natural and relaxed**, not like an intentional model pose. Avoid any high leg lifts or exaggerated angles. THIS IS A NON-NEGOTIABLE INSTRUCTION for a natural look.
    *   **CRITICAL: The subject must be looking directly at the camera.**
    *   **CRITICAL: The subject's hands and arms MUST NOT obstruct the view of their abdomen. Position them naturally to the sides or in another way that leaves the torso fully visible.**

4.  **Lighting Transformation:**
    *   First, perfectly isolate the subject from their background.
    *   Keep the original background environment, but **subtly darken it**. It should only be slightly dimmer than the subject, just enough to draw focus to them without making the scene look unnaturally dark.
    *   Next, apply a bright yet **soft, professional 3-point studio lighting setup** only to the subject. The light should have a **slightly warm tone**, creating a flattering look and eliminating any harsh shadows.
    *   The subject must remain the brightest element in the image, standing out vividly against the slightly darkened background.

5.  **Physique Refinement (Amateur Athletic Build - CRITICAL & NON-NEGOTIABLE):**
    *   Modify the subject's entire physique from the waist down (abdomen, lower body, and legs) to have a fit, 'amateur athletic' build. 
    *   This means you MUST **completely remove all visible excess fat** from the belly, sides (obliques), hips, and thighs. The stomach MUST be flat and toned, and the legs should appear strong and shapely.
    *   **CRITICAL: This must look natural.** Do NOT create overly defined six-pack abs or the physique of a professional bodybuilder. The goal is a healthy, toned look for someone who exercises regularly.

6.  **Conditional Clothing Modification (CRITICAL & NON-NEGOTIABLE):**
    *   Examine the subject's top. **If, and ONLY IF,** the garment fully covers their stomach, you MUST digitally crop it to become a crop top that ends just under the bust, revealing the entire abdomen. This is mandatory to fulfill the Abdomen Visibility rule.
    *   If the abdomen is already visible in the original photo, you MUST NOT alter the top.
    *   Do not change their pants/shorts unless necessary to accommodate the new pose.

7.  **Final Output:**
    *   The final image MUST be photorealistic and seamlessly edited.
    *   Return ONLY the final image. Do not add any text, borders, or other elements.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const ai = getInitializedAi();
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    const prompt = `You are an expert AI fashion stylist. Your task is to realistically place the provided garment onto the person in the model image.

**Instructions:**
1.  **Analyze both images:** Carefully examine the model's pose, body shape, and the lighting in their photo. Also, analyze the garment's shape, texture, and how it drapes.
2.  **Apply the Garment:** Seamlessly fit the garment onto the model. It must look natural, with realistic folds, shadows, and highlights that match the lighting on the model.
3.  **Preserve Identity & Pose:** Do NOT alter the model's face, body, pose, or the background. Only add the garment.
4.  **Output:** Return only the final photorealistic image of the model wearing the garment.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return handleApiResponse(response);
};

export const generatePoseVariation = async (baseImageUrl: string, poseInstruction: string): Promise<string> => {
    const ai = getInitializedAi();
    const baseImagePart = dataUrlToPart(baseImageUrl);
    const prompt = `Carefully analyze the provided image. Your task is to regenerate the image with the person in a new pose as described, while maintaining their identity, clothing, and the background style.

**Instructions:**
1.  **Preserve Identity:** Do NOT change the person's face, hair, or distinct features. Their identity must remain the same.
2.  **Maintain Appearance:** Keep the person's clothing and the style of the background consistent with the original image.
3.  **Change Pose:** Modify the person's pose to: "${poseInstruction}".
4.  **Output:** Return only the newly generated photorealistic image.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [baseImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return handleApiResponse(response);
};

export const adjustBodyShape = async (baseImageUrl: string, direction: 'more' | 'less'): Promise<string> => {
    const ai = getInitializedAi();
    const baseImagePart = dataUrlToPart(baseImageUrl);
    const prompt = `You are a precise AI photo editor. The user wants to subtly adjust the abdominal muscles on the person in the image.

**Instruction:**
*   **Direction:** "${direction}"
*   If the direction is "more", slightly **increase** the definition of the six-pack abs, making them a bit more visible and toned.
*   If the direction is "less", slightly **decrease** the definition of the abs, making the stomach flatter and smoother.
*   **CRITICAL:** The change MUST be subtle and photorealistic.
*   **NON-NEGOTIABLE:** Do NOT change anything else. The face, hair, body shape, clothing, lighting, and background must remain absolutely identical.

Return ONLY the edited image.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [baseImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return handleApiResponse(response);
}