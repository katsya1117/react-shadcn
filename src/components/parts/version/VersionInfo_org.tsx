import { useState } from "react";
import { Modal } from "react-bootstrap";
import { VersionInfoStyle } from "./VersionInfoStyle.css";


export const VersionInfo = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <div className={VersionInfoStyle.container}>
        <div className={VersionInfoStyle.icon} onClick={handleShow}>
          <a href="#"></a>
        </div>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>統合サーバー</h4>
          <p>JCL Version 2.0.0 ( XXXX/XX/XX )</p>
          <p>SS Version 2.0.0 ( XXXX/XX/XX )</p>
        </Modal.Body>
        <Modal.Footer>
          Copyright &copy;XXXX XXXXXXXX
        </Modal.Footer>
      </Modal>
    </>
  )
}