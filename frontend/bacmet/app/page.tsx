export default function Home() {
  const heroText = "BacMet is an easy-to-use bioinformatics resource of antibacterial biocide- and metal-resistance genes.";
  const title = "BacMet Antibacterial Biocide & Metal Resistance Genes Database";
  const searchTitle = "Simple search"
  return (
    <>
      <div className="text-center bg-image position-relative"
        style={{backgroundImage: "url('/hero-image.jpg')"}}>
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="bg-dark bg-opacity-75 px-4 py-3">
            <p className="hero-image-text">{heroText}</p>
          </div>
        </div>
      </div>
      <div className="container my-5">
        <div className="row gx-5">
          <div className="col-12 col-lg-8 order-1">
            <div className="p-3">
              <h1 className="text-center">{title}</h1>
              <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rerum dolorem debitis adipisci, accusamus quos autem? Praesentium quis possimus, veniam a autem eveniet voluptatibus eos maiores eius ratione veritatis nobis? Quasi repellat atque eligendi mollitia perferendis ad aliquid quo tempore autem cum beatae soluta facilis amet ex esse quis eum similique sed animi, exercitationem placeat, officia eos? Molestiae perferendis, molestias sequi vel nesciunt expedita harum deserunt consequuntur hic itaque qui omnis?</p>
            </div>
          </div>
          <div className="col-12 col-lg-4 order-2">
            <div className="p-3 border bg-white">
              <h2>{searchTitle}</h2>
              <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Minima quibusdam quae vel consequuntur quis veritatis debitis cumque minus sequi nisi? Illo magnam ipsum accusantium, vel ex omnis minima soluta voluptatibus!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
