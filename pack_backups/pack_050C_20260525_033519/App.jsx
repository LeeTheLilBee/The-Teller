import React from "react";
import OriginalApp from "./AppBefore050B.jsx";
import Pack050BDemo from "./teller/Pack050BDemo.jsx";

export default function App() {
  return (
    <>
      <OriginalApp />

      <section data-pack="TELLER_PACK_050B_PREVIEW" style={{ marginTop: "2rem" }}>
        <Pack050BDemo />
      </section>
    </>
  );
}
