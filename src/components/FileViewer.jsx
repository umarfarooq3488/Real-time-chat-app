import React from "react";

const FileViewer = ({ fileURL, fileType }) => {
  if (!fileURL) return null;

  const isImage = fileType?.startsWith("image/");
  const isPDF = fileType === "application/pdf";
  const isVideo = fileType?.startsWith("video/");
  const isAudio = fileType?.startsWith("audio/");

  // Get file extension from URL
  const fileExtension = fileURL.split(".").pop().toLowerCase();

  // Helper function to get file name from URL
  const getFileName = (url) => {
    return url.split("/").pop().split("?")[0];
  };

  if (isImage) {
    return (
      <div className="max-w-sm my-2">
        <img
          src={fileURL}
          alt="Attached file"
          className="rounded-lg max-h-[200px] object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  if (isPDF) {
    return (
      <div className="my-2 flex flex-col gap-2">
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          View PDF: {getFileName(fileURL)}
        </a>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="my-2">
        <video controls className="max-w-full rounded-lg" preload="metadata">
          <source src={fileURL} type={fileType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="my-2">
        <audio controls className="w-full">
          <source src={fileURL} type={fileType} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // For all other file types
  return (
    <div className="my-2">
      <a
        href={fileURL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
        download
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Download: {getFileName(fileURL)}
      </a>
    </div>
  );
};

export default FileViewer;
