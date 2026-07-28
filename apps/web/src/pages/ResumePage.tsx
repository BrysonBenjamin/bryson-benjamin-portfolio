import { useEffect } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Section } from "../components/layout/Section";

const resume = {
  name: "Bryson Benjamin",
  role: "Product Manager & Full-Stack Engineer",
  location: "Castro Valley, CA",
  pdfPath: "/resume/bryson-benjamin-resume.pdf",
  pdfDownloadName: "Bryson-Benjamin-Resume.pdf"
} as const;

function ResumePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Resume — ${resume.name}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <>
      <Section className="resume-hero">
        <p className="section__eyebrow">Resume</p>
        <h1 id="page-title">{resume.name}</h1>
        <p className="resume-role">{resume.role}</p>
        <p className="resume-location">{resume.location}</p>
        <div className="resume-hero__actions">
          <a
            className="bb-button bb-button--lg bb-button--primary"
            href={resume.pdfPath}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open PDF
            <ExternalLink size={18} aria-hidden="true" />
          </a>
          <a
            className="bb-button bb-button--lg bb-button--secondary"
            href={resume.pdfPath}
            download={resume.pdfDownloadName}
          >
            Download PDF
            <Download size={18} aria-hidden="true" />
          </a>
        </div>
      </Section>

      <Section className="resume-document" aria-labelledby="resume-document-title">
        <h2 id="resume-document-title">Resume</h2>
        <div className="resume-viewer">
          <iframe src={resume.pdfPath} title={`${resume.name} resume PDF`} />
        </div>
        <p className="resume-viewer__fallback">
          If the preview does not load,{" "}
          <a href={resume.pdfPath} target="_blank" rel="noreferrer noopener">
            open the PDF in a new tab
          </a>
          .
        </p>
      </Section>
    </>
  );
}

export default ResumePage;
