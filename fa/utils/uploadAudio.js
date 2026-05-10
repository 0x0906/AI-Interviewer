import uuid from "react-native-uuid";

export const uploadInterviewAudios = async (
  answers,
  questions,
  onProgress
) => {
  return new Promise((resolve, reject) => {
    console.log("Starting upload...");

    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    answers.forEach((item, index) => {
      const audioUri = item?.[1];

      if (audioUri) {
        const fileName = `${uuid.v4()}.m4a`;

        console.log("Appending file:", audioUri);

        formData.append("files", {
          uri: audioUri,
          type: "audio/m4a",
          name: fileName,
        });
      }
    }); 

    formData.append("questions", JSON.stringify(questions));

    xhr.open("POST", `${process.env.EXPO_PUBLIC_SERVER_URL}/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round(
          (event.loaded * 100) / event.total
        );
        console.log("Upload progress:", percent);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      console.log("XHR status:", xhr.status);
      console.log("XHR response:", xhr.response);

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = (err) => {
      console.log("XHR error:", err);
      reject(new Error("Network error"));
    };

    xhr.send(formData);
  });
};
