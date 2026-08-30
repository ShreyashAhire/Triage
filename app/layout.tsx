import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"PatientTriage.ai — Safety-First ED Command Center",description:"Interactive Round 2 prototype for dynamic, age-aware and explainable emergency department triage."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
