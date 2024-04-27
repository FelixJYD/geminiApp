import { Camera, CameraType } from "expo-camera";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "./components/button";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Loader from "./components/loadder";

export default function App() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [isPreview, setIsPreview] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [flash, setFlash] = useState(Camera.flash);
  const [isLoading, setIsLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [apiResponse, setApiResponse] = useState("");

  const cameraRef = useRef(null);
  const imageRef = useRef(null);

  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_API_KEY);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraType = () => {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
    cancelPreview();
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = { quality: 0.5, base64: true, skipProcessing: true };
        const data = await cameraRef.current.takePictureAsync(options);

        if (data.uri) {
          await cameraRef.current.pausePreview();
          setIsPreview(true);
          imageRef.current = data;
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const cancelPreview = async () => {
    await cameraRef.current.resumePreview();
    setIsPreview(false);
  };

  const runModel = async () => {
    setIsLoading(true);

    const data = {
      inlineData: {
        data: imageRef.current.base64,
        mimeType: "image/png",
      },
    };

    // fetch("https://jsonplaceholder.typicode.com/posts")
    //   .then((response) => response.json())
    //   .then((json) => setApiResponse(json))
    //   .catch((error) => console.log(error))
    //   .finally(() => handelShowResponse());

    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = "¿Puedes decirme si la fruta de la imagen es comestible?";

    const result = await model.generateContent([prompt, data]);
    setApiResponse(result.response.text());
    handelShowResponse();
    console.log(result.response.text());
  };
  const handelShowResponse = () => {
    setIsLoading(false);
    setShowResponse(true);
  };
  const handleHideResponse = () => {
    setShowResponse(false);
    cancelPreview();
  };

  return (
    <View style={styles.container}>
      {showResponse && (
        <View style={styles.apiResponseModal}>
          <View style={styles.apiResponseContainer}>
            <ScrollView>
              <Text style={styles.responseText}>{apiResponse}</Text>
            </ScrollView>
            <Button title={"Aceptar"} onPress={handleHideResponse} />
          </View>
        </View>
      )}
      <View style={styles.camera}>
        <Camera
          style={styles.camera}
          type={type}
          flashMode={flash}
          ref={cameraRef}
        />
      </View>
      {isLoading && (
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size={"large"} color={"#0db7ed"} />
          <Text style={styles.indicatorText}>Cargando datos</Text>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <View style={styles.mainButtons}>
          <Button
            title={"Cambiar cámara"}
            icon={"cycle"}
            onPress={toggleCameraType}
          />
          {isPreview && (
            <Button
              title={"Cancelar"}
              icon={"circle-with-cross"}
              onPress={cancelPreview}
            />
          )}

          {!isPreview && (
            <Button title={"Capturar"} icon={"camera"} onPress={takePicture} />
          )}
        </View>
        {isPreview && (
          <Button
            style={styles.sendButton}
            title={"Enviar"}
            icon={"paper-plane"}
            onPress={runModel}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24272e",
  },
  camera: {
    height: 400,
    width: 320,
    borderRadius: 30,
    overflow: "hidden",
    borderColor: "#f7f8fa",
    borderWidth: 2,
  },
  buttonContainer: {
    height: 200,
    width: "90%",
    flexDirection: "column",
    padding: 30,
    justifyContent: "space-between",
    marginTop: 40,
  },
  mainButtons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  indicatorContainer: {
    padding: 30,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 280,
    borderRadius: 30,
  },
  indicatorText: {
    color: "#f7f8fa",
    fontSize: 20,
    marginTop: 20,
  },
  apiResponseModal: {
    position: "absolute",
    zIndex: 4,
    height: "90%",
    paddingVertical: 50,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  apiResponseContainer: {
    backgroundColor: "#24272e",
    borderRadius: 30,
    borderColor: "#f7f8fa",
    borderWidth: 2,
    padding: 20,
  },
  responseText: {
    color: "#f7f8fa",
    fontSize: 22,
  },
});
