import Image from "next/image";
import bacmetWorkflow from "../../public/img/bacmetworkflow.png"

export default function About() {
  const page_title = "About BacMet";

  return (
    <div className="text-center pt-3">
      <h1>{page_title}</h1>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam exercitationem reiciendis esse assumenda error eius voluptas temporibus! Nemo voluptas ad asperiores illum commodi veniam, adipisci repellendus amet totam ipsum nam. Aliquam architecto facere cumque natus tempora laborum, ipsum minus labore, consectetur earum sunt culpa inventore deserunt qui excepturi nulla numquam.</p>
      <Image
      src={bacmetWorkflow}
      alt="BacMet workflow"
      className="img-fluid mt-3 mb-3"
      />
    </div>
  );
}



