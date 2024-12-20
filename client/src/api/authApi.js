import axios from "axios";
import { toast } from "react-hot-toast";

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log("backend:", BACKEND_URL);
const API_URL = BACKEND_URL + "/api/auth";
console.log("API URL:", API_URL);
// const API_URL = 'https://jobx-32a058281844.herokuapp.com/api/auth';

export const loginUserAPI = async (loginState) => {
  try {
    const data = loginState;
    console.log("data:", data);
    const response = await axios.post(`${API_URL}/login`, data);

    if (response.status === 200) {
      const token = response.data.token;
      console.log("Login successful");

      // Fetch user information
      const userResponse = await axios.get(`${API_URL}/user/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("userResponse:", userResponse);

      if (userResponse.status === 200) {
        const userData = userResponse.data;
        console.log("userData:", userData);
        console.log("isVerified:", userData.isVerified);

        try {
          const profileResponse = await axios.get(
            `${BACKEND_URL}/api/user-profile/${userData._id}`
          );
          console.log("profileResponse:", profileResponse);
          // If we reach here, it means the profile exists
          return { success: true, token, userData, hasProfile: true };
        } catch (profileError) {
          if (profileError.response && profileError.response.status === 404) {
            // Profile doesn't exist
            return { success: true, token, userData, hasProfile: false };
          } else {
            // Handle other errors
            console.error("Error checking user profile:", profileError);
            return { success: false, error: "Error checking user profile" };
          }
        }
      }
    }
  } catch (error) {
    console.log("Login failed", error);
    if (error.response) {
      if (error.response.status === 403) {
        console.log("error response from the backend to frontend:", error.response)
        return {
          success: false,
          error: error.response.data.message,
          errorCode: error.response.status,
          email: error.response.data.email
        };
      } else if (error.response.status === 404) {
        return {
          success: false,
          error: "User not found. Please check your username.",
        };
      } else if (error.response.status === 401) {
        return {
          success: false,
          error: "Invalid password. Please check your password.",
        };
      } else {
        return {
          success: false,
          error: "Network or server error. Please try again later.",
        };
      }
    } else {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }
};

export const registerUserAPI = async (signUpState) => {
  try {
    const data = {
      username: signUpState["username"],
      password: signUpState["password"],
      email: signUpState["email"],
      role: signUpState["role"],
      companyName: signUpState["companyName"],
    };
    console.log("data", data);
    console.log(API_URL);
    const response = await axios.post(`${API_URL}/register`, data);
    console.log("Status:", response.status);
    console.log("Response:", response.data);

    if (response.status === 201) {
      console.log("Registration successful");
      toast.success(response.data.message);
      return true;
    }
  } catch (error) {
    console.log("Registration failed", error);
    if (error.response && error.response.status === 400) {
      console.log("Username is already in use.", error);
      toast.error(error.response.data.message);
    } else if (error.response && error.response.status === 500) {
      console.error("Error during registration:", error);
      toast.error("Network or server error. Please try again later.");
    } else {
      console.log("Failed");
      toast.error("Registration failed. Please try again.");
    }
  }
};

export const updateUserAPI = async ({ data, authToken }) => {
  await axios.put(`${BACKEND_URL}/api/auth/update`, data, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};
