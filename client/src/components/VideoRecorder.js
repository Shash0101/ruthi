import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = BACKEND_URL + "/api/";

const VideoRecorder = ({ questionId, jobId, userId, onTimerActiveChange }) => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thinkingTime, setThinkingTime] = useState(30); // 30 seconds for thinking
  const [recordingTime, setRecordingTime] = useState(150); // 2 mins 30 seconds for recording
  const [timerActive, setTimerActive] = useState(true);
  const [showRecordingIcon, setShowRecordingIcon] = useState(false);
  const [azureService, setAzureService] = useState(false); // State to hold azureService status

 // Fetch configuration including azureService status
 useEffect(() => {
  const fetchConfig = async () => {
    try {
      const config = yaml.load(fs.readFileSync('config/dev.config.yaml', 'utf8'));
      setAzureService(config.azureService || false);
    } catch (error) {
      setAzureService(false);
      console.error("Error fetching configuration:", error);
    }
  };

  fetchConfig();
}, []);

  // Effect to notify parent component of timerActive changes
  useEffect(() => {
    onTimerActiveChange(timerActive);
  }, [timerActive, onTimerActiveChange]);

  useEffect(() => {
    // Reset or perform actions when questionId changes
    setCapturing(false);
    setRecordedChunks([]);
    setThinkingTime(30); // Reset thinking time if needed
    setRecordingTime(150); // Reset recording time if needed
    setTimerActive(true);
    setShowRecordingIcon(false);
  }, [questionId]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => [...prev, data]);
      }
    },
    [recordedChunks]
  );

  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setCapturing(false);
      setRecordingTime(0);
      setShowRecordingIcon(false);
      setTimerActive(false);
    }
  }, []);

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    setThinkingTime(0);
    setShowRecordingIcon(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
  }, [handleDataAvailable]);

  const uploadChunk = async (chunk, index, totalChunks) => {
    const formData = new FormData();
    formData.append("video", chunk, "video-chunk");
    formData.append("userId", userId);
    formData.append("jobId", jobId);
    formData.append("questionId", questionId);
    formData.append("chunkIndex", index);
    formData.append("totalChunks", totalChunks);

    try {
      await axios.post(API_URL + "/upload/chunk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(
            (prevProgress) => prevProgress + percentCompleted / totalChunks
          );
        },
      });
      console.log(`Chunk ${index + 1}/${totalChunks} uploaded successfully`);
    } catch (error) {
      console.error("Error uploading chunk:", error);
      throw error;
    }
  };

  const uploadVideo = async (blob) => {
    const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);
    setUploadProgress(0);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, blob.size);
      const chunk = blob.slice(start, end);
      await uploadChunk(chunk, i, totalChunks);
    }

    try {
      await axios.post(API_URL + "/upload/finalize", {
        userId,
        jobId,
        questionId,
        totalChunks,
      });
      console.log("Upload finalized");
      setUploadProgress(100);
    } catch (error) {
      console.error("Error finalizing upload:", error);
    }
  };

  const uploadToAzure = async (blob) => {
    try {
      // Fetch the SAS URL from your server
      const response = await axios.get(
        `${API_URL}/azure/sas/${userId}/${jobId}/${questionId}`
      );
      const { sasUrl } = response.data;

      console.log("SAS URL:", sasUrl);

      // Upload the blob to Azure Blob Storage using the SAS URL
      await axios.put(sasUrl, blob, {
        headers: {
          "x-ms-blob-type": "BlockBlob",
        },
      });

      console.log("Upload to Azure Blob Storage successful");
    } catch (error) {
      console.error("Error uploading to Azure Blob Storage:", error);
    }
  };

  useEffect(() => {
    if (!capturing && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      if (azureService) {
        uploadToAzure(blob); // Call Azure upload if service is enabled
      } else {
        uploadVideo(blob); // Otherwise, call standard video upload
      }
      setRecordedChunks([]);
    }
  }, [recordedChunks, capturing, azureService]);

  useEffect(() => {
    if (timerActive) {
      const thinkingTimer = setTimeout(() => {
        if (!capturing) {
          handleStartCaptureClick();
        }
        const recordingTimer = setTimeout(() => {
          if (capturing) {
            handleStopCaptureClick();
          }
        }, recordingTime * 1000);

        return () => clearTimeout(recordingTimer);
      }, thinkingTime * 1000);

      return () => clearTimeout(thinkingTimer);
    }
  }, [
    thinkingTime,
    recordingTime,
    timerActive,
    capturing,
    handleStartCaptureClick,
    handleStopCaptureClick,
  ]);

  useEffect(() => {
    let interval;
    if (timerActive && thinkingTime > 0) {
      interval = setInterval(() => {
        setThinkingTime((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && recordingTime > 0 && capturing) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [thinkingTime, recordingTime, timerActive, capturing]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 ">
      <div className="w-[98%] h-full mb-4 relative">
        <Webcam
          audio={true}
          ref={webcamRef}
          muted={true}
          className="w-full h-full rounded-lg shadow-lg border-10 border-gray-300 "
        />
        {showRecordingIcon && (
          <div className="absolute top-0 left-0 m-2 p-2 bg-red-600 text-white rounded-full">
            Recording...
          </div>
        )}
        <div className="absolute bottom-0 left-0 m-2 p-2 bg-white text-black rounded-lg">
          {thinkingTime > 0 && !capturing
            ? `Recording will start in ${thinkingTime} seconds`
            : recordingTime > 0 &&
              `Recording will stop in ${recordingTime} seconds`}
        </div>
      </div>
      <div className="flex space-x-4">
        {thinkingTime > 0 && !capturing && (
          <button
            onClick={handleStartCaptureClick}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300"
          >
            Start Capture
          </button>
        )}
        {recordingTime > 0 && capturing && (
          <button
            onClick={handleStopCaptureClick}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
          >
            Stop Capture
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;
