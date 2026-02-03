import {useState} from "react"
import {Button, Modal} from "react-bootstrap";
import {InformationStyle} from "./InformationStyle.css";


export const Information = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <>
    <div className={InformationStyle.container}>
      <div className={InformationStyle.icon} onClick={handleShow}>
        <a href="#" data-bind="text: tInfo, click: onClickInformation"></a>
      </div>
      {/* 新規がある時表示 */}
      <img className={InformationStyle.new} src="/src/assets/icon/new.png" 
      data-bind="text: tInfo, click: onClickInformation, visible: new_arrivals" />
    </div>
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>お知らせ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        お知らせ一覧
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleClose}>閉じる</Button>
      </Modal.Footer>
    </Modal>
    </>
  )
}
