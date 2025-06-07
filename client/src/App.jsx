import { useState, useCallback } from "react"
import { Analytics } from '@vercel/analytics/react';

import Header from "./components/Header"
import FileUploadArea from "./components/FileUpload/FileUploadArea"
import SettingsPanel from "./components/Settings/SettingsPanel"
import SingleImageResult from "./components/Results/SingleImageResult"
import BatchImageResult from "./components/Results/BatchImageResult"
import ErrorAlert from "./components/ErrorAlert"
import useFileUpload from "./hooks/useFileUpload"
import { API_BASE_URL } from "./utils/constants"

function App() {
  // Application state
  const [mode, setMode] = useState("single")
  const [quality, setQuality] = useState(80)
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [converting, setConverting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [conversionError, setConversionError] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [batchResult, setBatchResult] = useState(null)

  // Initialize file upload hook with current mode
  const {
    selectedFiles,
    previews,
    dragActive,
    error: uploadError,
    handleFileSelect,
    removeFile,
    openFileDialog,
    resetFiles,
    clearError,
    fileInputProps,
    dragProps,
    fileInputRef,
  } = useFileUpload(mode)

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode)
      resetFiles()
      setSingleResult(null)
      setBatchResult(null)
      setConversionError(null)
    },
    [resetFiles],
  )

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    clearError()
    setConversionError(null)
  }, [clearError])

  // Convert images
  const handleConvert = useCallback(async () => {
    if (selectedFiles.length === 0) return

    clearAllErrors()
    setConverting(true)

    try {
      const formData = new FormData()

      // Add files to form data
      if (mode === "single") {
        formData.append("image", selectedFiles[0])
      } else {
        selectedFiles.forEach((file) => {
          formData.append("images", file)
        })
      }

      // Add conversion settings
      formData.append("quality", quality)
      if (width) formData.append("width", width)
      if (height) formData.append("height", height)

      // Make API request - Updated endpoints to match backend
      const endpoint = mode === "single" ? "/api/convert" : "/api/batch-convert"
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Conversion failed")
      }

      const result = await response.json()

      // Check if the response indicates success
      if (!result.success) {
        throw new Error(result.error || "Conversion failed")
      }

      // Update state with results - Updated to match backend response structure
      if (mode === "single") {
        setSingleResult({
          webpUrl: result.data.downloadUrl,
          webpFilename: result.data.filename,
          originalSize: result.data.originalSize,
          webpSize: result.data.convertedSize,
          compressionRatio: result.data.compressionRatio,
          originalDimensions: result.data.originalDimensions,
          quality: result.data.quality
        })
      } else {
        setBatchResult({
          zipUrl: result.data.downloadUrl,
          zipFilename: result.data.zipFilename,
          totalFiles: result.data.totalFiles,
          successfulConversions: result.data.successfulConversions,
          failedConversions: result.data.failedConversions,
          totalOriginalSize: result.data.totalOriginalSize,
          totalConvertedSize: result.data.totalConvertedSize,
          overallCompressionRatio: result.data.overallCompressionRatio,
          results: result.data.results
        })
      }
    } catch (error) {
      console.error("Conversion error:", error)
      setConversionError(error.message || "An error occurred during conversion")
    } finally {
      setConverting(false)
    }
  }, [selectedFiles, mode, quality, width, height, clearAllErrors])

  // Download converted file(s)
  const handleDownload = useCallback(async () => {
    setDownloading(true)

    try {
      let url
      let filename

      if (mode === "single" && singleResult) {
        // For single files, construct the full URL
        url = `${API_BASE_URL}${singleResult.webpUrl}`
        filename = singleResult.webpFilename || "converted.webp"
      } else if (mode === "batch" && batchResult) {
        // For batch files, construct the full URL
        url = `${API_BASE_URL}${batchResult.zipUrl}`
        filename = batchResult.zipFilename || "webp_images.zip"
      } else {
        throw new Error("No conversion result available")
      }

      // Create a temporary link and trigger download
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.target = "_blank" // Open in new tab as fallback
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download error:", error)
      setConversionError(error.message || "Download failed")
    } finally {
      setDownloading(false)
    }
  }, [mode, singleResult, batchResult])

  // Reset the application
  const handleReset = useCallback(() => {
    resetFiles()
    setSingleResult(null)
    setBatchResult(null)
    setConversionError(null)
  }, [resetFiles])

  // Determine what to render based on application state
  const renderContent = () => {
    // Show results if conversion is complete
    if (mode === "single" && singleResult) {
      return (
        <SingleImageResult
          result={singleResult}
          quality={quality}
          downloading={downloading}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )
    }

    if (mode === "batch" && batchResult) {
      return (
        <BatchImageResult
          batchResult={batchResult}
          downloading={downloading}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )
    }

    // Show file upload and settings
    return (
      <>
        <FileUploadArea
          mode={mode}
          dragActive={dragActive}
          selectedFiles={selectedFiles}
          previews={previews}
          onDrop={dragProps.onDrop}
          onDragOver={dragProps.onDragOver}
          onDragLeave={dragProps.onDragLeave}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeFile}
          onReset={resetFiles}
          fileInputRef={fileInputRef}
        />

        {selectedFiles.length > 0 && (
          <>
            <SettingsPanel
              quality={quality}
              setQuality={setQuality}
              width={width}
              setWidth={setWidth}
              height={height}
              setHeight={setHeight}
            />

            <div className="mt-8 text-center">
              <button
                onClick={handleConvert}
                disabled={converting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 mx-auto"
              >
                {converting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Converting...
                  </>
                ) : (
                  <>Convert to WebP</>
                )}
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Analytics />
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Header mode={mode} onModeChange={handleModeChange} />

        {/* Error alerts */}
        <ErrorAlert error={uploadError} onClear={clearError} />
        <ErrorAlert error={conversionError} onClear={() => setConversionError(null)} />

        {/* Main content */}
        {renderContent()}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>WebP Converter Pro &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
    </>
  )
}

export default App