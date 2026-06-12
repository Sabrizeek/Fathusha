const Footer = () => {
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-4 px-6 py-6 text-xs md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:items-center">
        <div>
          <div className="font-semibold">IMS</div>
          <div className="mt-2">© 2026 IMS Portal. All rights reserved by the Department of Computer Science.</div>
        </div>
        <span className="md:text-center">Privacy Public</span>
        <span className="md:text-center">Terms of Services</span>
        <span className="md:text-center">Contact Support</span>
        <span className="md:text-center">University Guidelines</span>
      </div>
    </footer>
  );
};

export default Footer;
