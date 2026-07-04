import 'dotenv/config'

export const protectScheduler = (req, res, next) => {
  try {
    const secretKey = req.headers['x-scheduler-secret-key'];
    if (!process.env.SCHEDULER_SECRET_KEY) {
      console.error("CRITICAL CONFIG ERROR: SCHEDULER_SECRET_KEY is missing from server .env file.");
      return res.status(500).json({
        success: false,
        message: "Internal server configuration mismatch."
      });
    }
    if (!secretKey || secretKey !== process.env.SCHEDULER_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: Invalid or missing x-scheduler-secret-key header tokens."
      });
    }

    next();
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Security layer validation fault.",
      error: error.message
    });
  }
};
