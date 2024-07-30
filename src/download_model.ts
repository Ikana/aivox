import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = "https://huggingface.co/ggerganov/whisper.cpp";
const pfx = "resolve/main/ggml";
const model = "base.en";

const downloadModel = async (modelsPath: string = "./models") => {
  const modelFileName = `ggml-${model}.bin`;
  const modelFilePath = join(modelsPath, modelFileName);

  if (!existsSync(modelsPath)) {
    mkdirSync(modelsPath, { recursive: true });
  }

  if (existsSync(modelFilePath)) {
    // Model already exists, skipping download
    return;
  }

  const url = `${src}/${pfx}-${model}.bin`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ggml model ${model}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileStream = createWriteStream(modelFilePath);
    fileStream.write(buffer);
    fileStream.end();

    // console.info(`Done! Model '${model}' saved in '${modelFilePath}'`);
  } catch (error: any) {
    console.error(error.message);
    console.error(
      "Please try again later or download the original Whisper model files and convert them yourself.",
    );
    process.exit(1);
  }
};

export default downloadModel;
