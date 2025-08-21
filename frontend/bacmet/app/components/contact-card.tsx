import type { Contact } from "../types";

interface ContactCardProps {
  contact: Contact;
}

const DEFAULT_AVATAR = "img/avatar.png";

export default function ContactCard({ contact }: ContactCardProps) {
  const imageSrc = contact.image ? contact.image : DEFAULT_AVATAR;

  return (
    <div className="col-lg-4 col-md-6 col-sm-12 mb-4 text-center p-4">
      <img
        src={imageSrc}
        className="rounded-circle mb-3 mx-auto d-block"
        alt={contact.name}
        style={{ width: "125px", height: "125px", objectFit: "cover" }}
      />
      <h2 className="mb-1 fs-6">{contact.name}</h2>
      <h3 className="text-muted mb-2 fs-6">{contact.job_title}</h3>
      <p className="mb-0">{contact.workplace}</p>
      <p className="mb-0">{contact.university}</p>
      <p className="mb-0"><strong>Email:</strong> {contact.email}</p>
      {contact.phone && (
        <p className="mb-0"><strong>Phone:</strong> {contact.phone}</p>
      )}
    </div>
  );
}