// pages/Upload.tsx
import { type FormEvent, useState } from 'react';
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from '~/lib/utils';
import { AIResponseFormat, prepareInstructions } from '../../constants';

const Upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [issuedAt] = useState<string>(new Date().toISOString());

  const handleFileSelect = (file: File | null) => setFile(file);

  // Normalisation robuste du feedback
  const normalizeFeedback = (raw: any): Feedback => ({
    overallScore: raw?.overallScore ?? 0,
    ATS: { score: raw?.ATS?.score ?? 0, tips: raw?.ATS?.tips ?? [] },
    toneAndStyle: { score: raw?.toneAndStyle?.score ?? 0, tips: raw?.toneAndStyle?.tips ?? [] },
    content: { score: raw?.content?.score ?? 0, tips: raw?.content?.tips ?? [] },
    structure: { score: raw?.structure?.score ?? 0, tips: raw?.structure?.tips ?? [] },
    skills: { score: raw?.skills?.score ?? 0, tips: raw?.skills?.tips ?? [] },
  });

  const handleAnalyze = async ({
                                 companyName,
                                 jobTitle,
                                 jobDescription,
                                 candidateName,
                                 file,
                               }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    candidateName: string;
    file: File;
  }) => {
    setIsProcessing(true);

    try {
      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) throw new Error('Failed to upload file');

      setStatusText('Converting to image...');
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) throw new Error('Failed to convert PDF to image');

      setStatusText('Uploading the image...');
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) throw new Error('Failed to upload image');

      setStatusText('Preparing data...');
      const uuid = generateUUID();
      const data: Resume = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        candidateName,
        feedback: {} as Feedback,
        issuedAt,
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analyzing...');
      const feedbackResponse = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription, AIResponseFormat })
      );

      if (!feedbackResponse) throw new Error('Failed to analyze resume');

      // Récupération texte brut
      const feedbackText =
        typeof feedbackResponse.message.content === 'string'
          ? feedbackResponse.message.content
          : feedbackResponse.message.content[0]?.text ?? "";

      // Parsing robuste : extraction JSON
      let parsed: Feedback;
      try {
        const firstCurly = feedbackText.indexOf("{");
        const lastCurly = feedbackText.lastIndexOf("}");
        const cleanText = firstCurly !== -1 && lastCurly !== -1
          ? feedbackText.slice(firstCurly, lastCurly + 1)
          : "{}";

        parsed = normalizeFeedback(JSON.parse(cleanText));
      } catch (err) {
        console.error("❌ Failed to parse AI feedback:", err, feedbackText);
        parsed = normalizeFeedback({});
      }

      data.feedback = parsed;
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analysis complete, redirecting...');
      navigate(`/resume/${uuid}`);
    } catch (err: any) {
      console.error("❌ Error during analysis:", err);
      setStatusText(`Error: ${err.message || 'Something went wrong'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const candidateName = formData.get('candidate-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) {
      setStatusText("Please upload a resume first");
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, candidateName, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
              </div>
              <div className="form-div">
                <label htmlFor="candidate-name">Candidate Name</label>
                <input type="text" name="candidate-name" placeholder="Candidate Name" id="candidate-name" />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
              </div>
              <div className="form-div">
                <label htmlFor="issuedAt">Issued At</label>
                <input
                  type="text"
                  name="issuedAt"
                  id="issuedAt"
                  value={new Date(issuedAt).toLocaleString()}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>
              <button className="primary-button" type="submit">Analyze Resume</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;