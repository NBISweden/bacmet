import ContactCard from "../components/contact-card";

export default function Contact() {
  const page_title = "Contact Us";
  const contact_description = "If you have any questions or need assistance, please reach out to us in the Bacmet team."
  

  const contact_info = [
    {
      "image": "img/character.png",
      "name": "Test Testsson",
      "job_title": "Professor",
      "workplace": "Department of Infectious Diseases",
      "university": "University of Gothenburg",
      "email": "test.testsson@xx.se",
      "phone": "+xx xxx xx xx",
    },
    {
      "image": "",
      "name": "Testy Testskog",
      "job_title": "PhD student",
      "workplace": "Department of Biology",
      "university": "University of Uppsala",
      "email": "x@x.se",
      "phone": "+xx xxx xx xx",
    },
    {
      "image": "",
      "name": "Test Testingsson",
      "job_title": "Teacher",
      "workplace": "Department of Infectious Diseases",
      "university": "University of Stockholm",
      "email": "testingsson@xx.com",
      "phone": "+xx xxx xx xx",
    },
    {
      "image": "",
      "name": "Test Testingsson",
      "job_title": "Teacher",
      "workplace": "Department of Infectious Diseases",
      "university": "University of Stockholm",
      "email": "testingsson@xx.com",
      "phone": "+xx xxx xx xx",
    },
    {
      "image": "",
      "name": "Test Testingsson",
      "job_title": "Teacher",
      "workplace": "Department of Infectious Diseases",
      "university": "University of Stockholm",
      "email": "testingsson@xx.com",
      "phone": "+xx xxx xx xx",
    }
  ]

  return (
    <>
      <div className="text-center pt-3">
        <h1>{page_title}</h1>
        <p>{contact_description}</p>
      </div>
      <div className="row justify-content-center">
        {contact_info.map((contact, index) => (
          <ContactCard contact={contact} key={index} />
        ))}
      </div>
    </>
  );
}
