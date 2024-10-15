import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // Adjust the import path based on your project structure

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = BACKEND_URL + "/api/auth"; // Assuming the API URL is defined in your environment variables

const VerificationPage = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [emailService, setEmailService] = useState(true); // Set default value to true
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userInfo } = useAuth(); // Get userInfo from AuthContext

  useEffect(() => {
    try {
      const config = yaml.load(fs.readFileSync('config/dev.config.yaml', 'utf8'));
      setEmailService(config.emailService || false);
    } catch (error) {
      console.error("Error loading email service config:", error);
      setEmailService(false); // Disable the page if there is an error
    }
  }, []);


  useEffect(() => {
    if (!isLoading) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // match the duration of the transition
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  useEffect(() => {
    // If email service is disabled, skip this component
    if (!emailService) {
      navigate("/home"); // Redirect to home if email service is off
      return;
    }
  });
  
  useEffect(() => {
    // If the user is already verified, navigate to the home page
    if (userInfo?.isVerified) {
      setTimeout(() => {
        return navigate("/home");
      }, 3000);
    }

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      try {
        const response = await axios.post(`${API_URL}/verify-email`, {
          token,
        }); 

        if (response.status === 200) {
          setIsVerified(true);
          setIsLoading(false);
          setTimeout(() => {
            navigate("/home");
          }, 2000);
        } else {
          throw new Error("Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        // Handle error (e.g., show an error message or redirect to an error page)
      }
    };

    setTimeout(() => {
      verifyEmail();
    }, 3000);
  }, [navigate, searchParams, userInfo]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div
              className={`relative h-32 w-32 transition-opacity ${
                isTransitioning ? "animate-fade-out" : "opacity-100"
              }`}
            >
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-4 border-t-green-500 border-gray-300 animate-spin-slow"></div>
            </div>
            <p className="mt-4 text-lg text-gray-700">
              Verifying your email...
            </p>
          </div>
        ) : { isVerified } ? (
          <div className="flex flex-col items-center">
            <div
              className={`text-green-500 transition-opacity ${
                isTransitioning ? "animate-fade-in" : "opacity-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-32 w-32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#48bb78"
                strokeWidth="0.5"
              >
                <circle cx="12" cy="12" r="11" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="mt-4 text-lg text-gray-700">
              Email verified successfully!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="mt-4 text-lg text-gray-700">
              An error occurred while verifying your email. Please try again
              later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
