import React, { useState, useRef, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  Alert, 
  Animated, 
  ActivityIndicator,
  Platform,
  TouchableOpacity
} from "react-native";
import { Camera } from "expo-camera/legacy";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ContinuousVerification = ({ username, links, onVerificationFailed }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isVerified, setIsVerified] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cameraRef = useRef(null);
  const verificationInterval = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus === "granted");
    })();

    return () => {
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
      }
    };
  }, []);

  const startVerificationAnimation = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const captureAndVerify = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        startVerificationAnimation();
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: true,
        });

        const formData = new FormData();
        formData.append("file", {
          uri: photo.uri,
          name: "photo.jpg",
          type: "image/jpeg",
        });
        formData.append("u", username);
        formData.append("data", "verify");

        const res = await axios.post(`${links}/upload`, formData, {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data !== "User login success") {
          setIsVerified(false);
          onVerificationFailed();
        } else {
          setIsVerified(true);
          startSuccessAnimation();
        }
      } catch (error) {
        console.error("Verification Error:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (hasPermission) {
      verificationInterval.current = setInterval(captureAndVerify, 5000);
    }

    return () => {
      if (verificationInterval.current) {
        clearInterval(verificationInterval.current);
      }
    };
  }, [hasPermission]);

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="camera-off" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubText}>Please enable camera permissions in settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <Camera 
          ref={cameraRef} 
          style={styles.camera} 
          type={Camera.Constants.Type.front}
          playSoundOnCapture={false}
        />
        <Animated.View 
          style={[
            styles.verificationContainer,
            {
              transform: [
                { translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -200]
                })}
              ]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={toggleExpanded}
          >
            <MaterialCommunityIcons 
              name={isVerified ? "check-circle" : "alert-circle"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.statusContainer}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons 
                    name={isVerified ? "check-circle" : "alert-circle"} 
                    size={24} 
                    color="#fff" 
                  />
                )}
                <Text style={styles.statusText}>
                  {isProcessing ? "Verifying..." : (isVerified ? "Verified" : "Verification Failed")}
                </Text>
              </View>
              <Text style={styles.subText}>
                {isProcessing ? "Please wait while we verify your identity" : 
                 (isVerified ? "Identity verified successfully" : "Please ensure you are the correct user")}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  cameraWrapper: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  verificationContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    marginLeft: 10,
    maxWidth: 200,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 10,
  },
  errorSubText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ContinuousVerification; 