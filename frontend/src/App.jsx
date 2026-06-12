import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import api from "./api/client";
import Footer from "./components/Footer";
import Header from "./components/Header";
import InternshipStatus from "./pages/InternshipStatus";
import RecordBook from "./pages/RecordBook";

const LockedRecordBook = () => (
  <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
    <section className="rounded border border-amber-300 bg-amber-100 p-5 text-sm text-amber-900">
      Record Book is locked until your offer letter is approved.
    </section>
  </main>
);

const App = () => {
  const [recordBookEnabled, setRecordBookEnabled] = useState(false);

  const syncInternshipState = (payload) => {
    setRecordBookEnabled(Boolean(payload?.application?.recordBookEnabled));
  };

  useEffect(() => {
    api
      .get("/internship/progress")
      .then((response) => syncInternshipState(response.data))
      .catch(() => setRecordBookEnabled(false));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header recordBookEnabled={recordBookEnabled} />
        <Routes>
          <Route path="/" element={<InternshipStatus onStatusChange={syncInternshipState} />} />
          <Route
            path="/record-book"
            element={recordBookEnabled ? <RecordBook /> : <LockedRecordBook />}
          />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
