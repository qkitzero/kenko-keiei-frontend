"use client";

import { useEffect } from "react";

export default function PrintFrame({
  issuer,
  title,
  subject,
  fileName,
  appendix,
  children,
}: {
  issuer: string;
  title: string;
  subject: string;
  fileName: string;
  appendix?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const pageTitle = document.title;

    const handleBeforePrint = () => {
      if (fileName) document.title = fileName;
    };
    const handleAfterPrint = () => {
      document.title = pageTitle;
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.title = pageTitle;
    };
  }, [fileName]);

  return (
    <table role="presentation" className="print-document">
      <thead>
        <tr>
          <td>
            <div className="text-subtle border-border hidden border-b pb-1 text-xs print:mb-4 print:block">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate">{issuer}</span>
                <span className="shrink-0">{title}</span>
              </div>
              <p className="truncate">{subject}</p>
            </div>
          </td>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            <div className="flex flex-col gap-6">{children}</div>
            {appendix}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
