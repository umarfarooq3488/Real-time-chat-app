import React from "react";

const FileViewer = ({ fileURL, fileType }) => {
  if (!fileURL) return null;

  const isImage = fileType?.startsWith("image/");
  const isPDF = fileType === "application/pdf";

  if (isImage) {
    return (
      <div className="max-w-sm my-2">
        <img
          src={fileURL}
          alt="Attached file"
          className="rounded-lg max-h-[200px] object-contain"
        />
      </div>
    );
  }

  if (isPDF) {
    return (
      <div className="my-2">
        <iframe
          src={fileURL}
          className="w-full h-[500px] rounded-lg"
          title="PDF viewer"
        />
      </div>
    );
  }

  // For other file types, show a download link
  return (
    <div className="my-2">
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
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Download Attachment
      </a>
    </div>
  );
};

export default FileViewer;
