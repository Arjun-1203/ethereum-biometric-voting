import React, { useState, useRef, useEffect } from "react";
import { Text, View, TouchableOpacity, Alert, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Camera } from "expo-camera/legacy";
import { Video } from "expo-av";
import axios from "axios";

const RECORDING_DURATION = 10000; // 10 seconds in milliseconds
const COUNTDOWN_DURATION = 3; // 3 seconds countdown before recording

const Vid = ({ username, links, setx, data, sete, onComplete, onRecordingComplete }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [preparingCountdown, setPreparingCountdown] = useState(COUNTDOWN_DURATION);
  const [isUploading, setIsUploading] = useState(false);
  const [shouldCallRecordingComplete, setShouldCallRecordingComplete] = useState(false);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } =
        await Camera.requestMicrophonePermissionsAsync();

      setHasPermission(
        cameraStatus === "granted" && audioStatus === "granted"
      );

      // Start countdown after permissions are granted
      if (cameraStatus === "granted" && audioStatus === "granted") {
        startPreparingCountdown();
      }
    })();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Effect to handle the recording complete callback
  useEffect(() => {
    if (shouldCallRecordingComplete && onRecordingComplete) {
      console.log("[Vid.jsx] Recording countdown finished, calling onRecordingComplete");
      onRecordingComplete();
      setShouldCallRecordingComplete(false);
    }
  }, [shouldCallRecordingComplete, onRecordingComplete]);

  const startPreparingCountdown = () => {
    const interval = setInterval(() => {
      setPreparingCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(interval);
          startRecording();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (cameraRef.current && !recording) {
      setRecording(true);
      setCountdown(10);
      
      // Update countdown every second
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Set flag to call onRecordingComplete in useEffect
            setShouldCallRecordingComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      try {
        console.log("[Vid.jsx] Starting video recording...");
        const video = await cameraRef.current.recordAsync();
        console.log("[Vid.jsx] Recording completed, URI:", video.uri);
        setVideoUri(video.uri);
        setRecording(false);
        clearInterval(countdownInterval);
        uploadVideo(video.uri);
      } catch (error) {
        console.error("[Vid.jsx] Recording Error:", error);
        clearInterval(countdownInterval);
        Alert.alert("Error", "Could not start recording");
        setRecording(false);
      }
      
      // Set timeout to stop recording after RECORDING_DURATION
      timerRef.current = setTimeout(() => {
        if (cameraRef.current && recording) {
          console.log("[Vid.jsx] Auto-stopping recording after timeout");
          cameraRef.current.stopRecording();
          // Set flag to call onRecordingComplete in useEffect
          setShouldCallRecordingComplete(true);
        }
      }, RECORDING_DURATION);
    }
  };

  const uploadVideo = async (uri) => {
    if (!uri) {
      Alert.alert("Error", "No video recorded");
      return;
    }

    console.log("[Vid.jsx] Starting video upload...");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "video.mp4",
      type: "video/mp4",
    });
    formData.append("u", username);
    formData.append("data", data);

    try {
      console.log("[Vid.jsx] Sending POST request to:", `${links}/upload`);
      console.log("[Vid.jsx] Request data - username:", username, "operation:", data);
      
      const res = await axios.post(`${links}/upload`, formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("[Vid.jsx] Upload response:", res.data);
      setIsUploading(false);
      
      // Handle different response formats
      let responseData = res.data;
      if (typeof res.data === 'string') {
        responseData = { message: res.data };
      }
      
      if (responseData.error) {
        throw new Error(responseData.error);
      }
      
      if (data === "login") {
        if (responseData.message === "User login success") {
          Alert.alert("Success", responseData.message);
          console.log("[Vid.jsx] Login success, calling sete(1)");
          sete(1);
        } else {
          Alert.alert("Failed", responseData.message || "Login failed");
        }
      } else if (data === "register") {
        if (responseData.status === "success") {
          Alert.alert("Success", responseData.message || "Face recording completed successfully");
          console.log("[Vid.jsx] Registration success, calling setx(1)");
          setx(1);
          
          // Call onComplete callback if provided
          if (onComplete) {
            console.log("[Vid.jsx] Calling onComplete callback");
            onComplete();
          }
        } else {
          Alert.alert("Failed", responseData.message || "Registration failed");
          setx(0);
        }
      } else {
        console.log(`[Vid.jsx] Unknown operation: ${data}, defaulting to success`);
        setx(1);
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error("[Vid.jsx] Upload Error:", error);
      setIsUploading(false);
      
      let errorMessage = "Could not upload video. Please try again.";
      if (error.response) {
        console.error("[Vid.jsx] Error response data:", error.response.data);
        console.error("[Vid.jsx] Error response status:", error.response.status);
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Upload Failed", errorMessage);
      console.log("[Vid.jsx] Setting x to 0 (failure)");
      setx(0);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false)
    return <Text style={styles.errorText}>No access to camera or microphone</Text>;

  return (
    <View style={styles.container}>
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Processing Video...</Text>
          <Text style={styles.loadingSubText}>Please wait, this may take a moment</Text>
        </View>
      )}
      
      {videoUri && !isUploading ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          useNativeControls
          resizeMode="cover"
          shouldPlay
        />
      ) : (
        <View style={styles.cameraContainer}>
          <Camera 
            ref={cameraRef} 
            style={styles.camera} 
            type={Camera.Constants.Type.front}
          />
          
          <View style={styles.faceGuideContainer}>
            <View style={styles.faceGuide} />
          </View>
          
          {recording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording: {countdown}s</Text>
            </View>
          )}
          
          {!recording && preparingCountdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{preparingCountdown}</Text>
              <Text style={styles.instructionText}>
                Position your face in the circle
              </Text>
            </View>
          )}
          
          <View style={styles.instructionContainer}>
            <Text style={styles.subInstructionText}>
              {!recording && preparingCountdown > 0 
                ? "Get ready! Recording will start automatically" 
                : recording 
                  ? "Please keep your face in the circle while recording"
                  : "Processing your video..."}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default Vid;

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const faceGuideSize = windowWidth * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  faceGuideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: faceGuideSize,
    height: faceGuideSize,
    borderRadius: faceGuideSize / 2,
    borderWidth: 3,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 80,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  subInstructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  loadingSubText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
});
