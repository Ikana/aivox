import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import fetch from "node-fetch";

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
    // console.info(
    //   `Model ${model} already exists at ${modelFilePath}. Skipping download.`,
    // );
    return;
  }

  if (existsSync(modelFilePath)) {
    // console.info(
    //   `Model ${model} already exists at ${modelFilePath}. Skipping download.`,
    // );
    return;
  }

  const url = `${src}/${pfx}-${model}.bin`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ggml model ${model}`);
    }

    const promise = new Promise<void>((resolve, reject) => {
      const fileStream = createWriteStream(modelFilePath);
      response.body.pipe(fileStream);

      fileStream.on("finish", () => {
        // console.info(`Done! Model '${model}' saved in '${modelFilePath}'`);
        resolve();
      });

      fileStream.on("error", (error) => {
        console.error(`Failed to write ggml model ${model}`);
        console.error(error.message);
        reject();
      });
    });

    await promise;
  } catch (error: any) {
    console.error(error.message);
    console.error(
      "Please try again later or download the original Whisper model files and convert them yourself.",
    );
    process.exit(1);
  }
};

export default downloadModel;
