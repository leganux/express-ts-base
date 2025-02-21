export const FileSwaggerExamples = {
  SuccessfulSingleUpload: {
    error: null,
    success: true,
    message: "File uploaded successfully",
    code: 200,
    data: {
      filepath: "/uploads/file-1234567890.jpg"
    }
  },
  SuccessfulMultipleUpload: {
    error: null,
    success: true,
    message: "Files uploaded successfully",
    code: 200,
    data: {
      filepaths: [
        "/uploads/file-1234567890.jpg",
        "/uploads/file-0987654321.pdf"
      ]
    }
  },
  SuccessfulDelete: {
    error: null,
    success: true,
    message: "File deleted successfully",
    code: 200,
    data: {}
  },
  ErrorNoFile: {
    error: "No file uploaded",
    success: false,
    message: "Please provide a file",
    code: 400,
    data: {}
  },
  ErrorFileNotFound: {
    error: "File not found",
    success: false,
    message: "The requested file does not exist",
    code: 404,
    data: {}
  },
  ErrorInvalidFileType: {
    error: "Invalid file type. Only images and PDFs are allowed.",
    success: false,
    message: "File upload error",
    code: 400,
    data: {}
  }
};
