-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT,
    "dob" TEXT NOT NULL,
    "houseNo" TEXT NOT NULL,
    "streetLocality" TEXT,
    "village" TEXT NOT NULL,
    "thana" TEXT NOT NULL,
    "tehsil" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'उत्तर प्रदेश',
    "pinCode" TEXT NOT NULL,
    "photoBase64" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "investigationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "centerName" TEXT NOT NULL DEFAULT 'जेठ कुमार यादव, वयम जन सेवा केंद्र',
    "signerName" TEXT NOT NULL DEFAULT 'Avneesh Kumar',
    "signerTitle" TEXT NOT NULL DEFAULT 'सक्षम अधिकारी/उप जिलाधिकारी',
    "signerLocation" TEXT NOT NULL DEFAULT 'पलिया,खीरी'
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_applicationId_key" ON "Certificate"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateId_key" ON "Certificate"("certificateId");
