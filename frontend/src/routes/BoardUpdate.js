import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactQuill, {Quill} from 'react-quill';
import { useNavigate, useParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import axios from 'axios';
import EditorToolBar, {insertHeart, insert3DButton} from "../components/EditorToolBar";
import { ToastContainer } from "react-toastify";
import { successMessage, errorMessage } from '../utils/SweetAlertEvent';
import { timeCheck} from '../utils/TimeCheck';
import Button from '@material-ui/core/Button';

import 'react-quill/dist/quill.snow.css'; // Quill snow스타일 시트 불러오기
import '../css/MyEditor.css'

const MyEditor = () => {
  const [ data, setData ] = useState([]);
  const [threeD, setThreeD] = useState(''); // 아직 기술 할당 안함
  const [imgData, setImgData] = useState([]);
  const quillRef = useRef();
  const params = useParams()._id
  const navigate = useNavigate();

  useEffect(() => { 
    if (timeCheck() === 0){ 
      errorMessage("로그인 만료!");
      navigate("/");
      return; 
    }
    axios.get('http://localhost:5000/board/board_detail', {
      params: {
        _id: params
      }
    })
      .then((response) => {
        setData(response.data.list);
        setImgData(response.data.list.imgData); // api 데이터 + 이후 넣을 데이터
        if (response.data.list.writer !== localStorage.key(0)){ // 다른 회원이 접근하는 것 방지
          errorMessage("잘못된 접근입니다!");
          navigate("/");
          return; 
        }
      })
      .catch((error) => {
        console.error(error);
    });
  }, [navigate, params]);

  const handleChange = useCallback((html) => {
    setData({realContent: html});
  }, []);
  
  // 이미지 처리를 하는 핸들러
  const imageHandler = () => {
    console.log('에디터에서 이미지 버튼을 클릭하면 이미지 핸들러가 시작됩니다!');

    // 1. 이미지를 저장할 input type=file DOM을 만든다.
    const input = document.createElement('input');
    // 속성 써주기
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*'); // 원래 image/*
    input.click(); // 에디터 이미지버튼을 클릭하면 이 input이 클릭된다.
    // input이 클릭되면 파일 선택창이 나타난다.

    // input에 변화가 생긴다면 = 이미지를 선택
    input.addEventListener('change', async () => {
      console.log('온체인지');
      const file = input.files[0];
      // multer에 맞는 형식으로 데이터 만들어준다.
      const formData = new FormData();
      formData.append('img', file); // formData는 키-밸류 구조
      // 백엔드 multer라우터에 이미지를 보낸다.
      try {
        const result = await axios.post('http://localhost:5000/img', formData);
        setImgData(prevFiles => [...prevFiles, result.data.realName]);
        console.log('성공 시, 백엔드가 보내주는 데이터', result.data.url);
        const IMG_URL = result.data.url;
        // 이미지 태그를 에디터에 써주기 - 여러 방법이 있다.
        const editor = quillRef.current.getEditor(); // 에디터 객체 가져오기
        // 현재 에디터 커서 위치값을 가져온다
        const range = editor.getSelection();
        // 가져온 위치에 이미지를 삽입한다
        editor.insertEmbed(range.index, 'image', IMG_URL);
      } catch (error) {
        console.log('이미지 불러오기 실패');
      }
    });
  };
//dnd 처리 핸들러
  const imageDropHandler = useCallback(async (dataUrl) => {
  try {
    // dataUrl을 이용하여 blob 객체를 생성
    const blob = await fetch(dataUrl).then(res => res.blob());
    // FormData 객체를 생성하고 'img' 필드에 blob을 추가
    const formData = new FormData();
    formData.append('img', blob);
    // FormData를 서버로 POST 요청을 보내 이미지 업로드를 처리
    const result = await axios.post('http://localhost:5000/img', formData);
    setImgData(prevFiles => [...prevFiles, result.data.realName]);
    console.log('성공 시, 백엔드가 보내주는 데이터', result.data.url);
    // 서버에서 반환된 이미지 URL을 변수에 저장
    const IMG_URL = result.data.url;
    // Quill 에디터 인스턴스를 호출
    const editor = quillRef.current.getEditor();
    // 현재 커서 위치를 가져옵니다.
    const range = editor.getSelection();
    // 현재 커서 위치에 이미지 URL을 이용해 이미지 삽입
    editor.insertEmbed(range.index, 'image', IMG_URL);
  } catch (error) {
    // 이미지 업로드 중 에러가 발생할 경우 콘솔에 에러를 출력
    console.log('이미지 업로드 실패', error);
  }
}, []);

// Undo and redo functions for Custom Toolbar
  function undoChange() {
    this.quill.history.undo();
  }
  function redoChange() {
    this.quill.history.redo();
  }

  const modules = useMemo(() => ({
    toolbar: {
      container: "#toolbar",
      handlers: {
        "undo": undoChange,
        "redo": redoChange,
        "image": imageHandler,
        insertHeart : insertHeart,
        insert3DButton : insert3DButton,
      },
    },
    // undo, redo history
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true
    },
    // image resize 추가
    ImageResize: { parchment: Quill.import('parchment') },
    imageDropAndPaste: { handler: imageDropHandler },
    htmlEditButton: {
        debug: true, // logging, default:false
        msg: "Edit the content in HTML format", //Custom message to display in the editor, default: Edit HTML here, when you click "OK" the quill editor's contents will be replaced
        okText: "Ok", // Text to display in the OK button, default: Ok,
        cancelText: "Cancel", // Text to display in the cancel button, default: Cancel
        buttonHTML: "&lt;&gt;", // Text to display in the toolbar button, default: <>
        buttonTitle: "Show HTML source", // Text to display as the tooltip for the toolbar button, default: Show HTML source
        syntax: false, // Show the HTML with syntax highlighting. Requires highlightjs on window.hljs (similar to Quill itself), default: false
        prependSelector: 'div#myelement', // a string used to select where you want to insert the overlayContainer, default: null (appends to body),
        editorModules: {} // The default mod
      },
      
  }), [imageDropHandler]);

  const formats = [
    "header", "font", "size", "bold", "italic", "underline", "align", "strike", "script", "blockquote", "background", "list", "bullet", "indent",
    "link", "image", "video", "color", "code-block", "formula", "direction"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (timeCheck() === 0){ 
      errorMessage("로그인 만료!");
      navigate("/");
      return; 
    }
    const description = quillRef.current.getEditor().getText(); //태그를 제외한 순수 text만을 받아온다. 검색기능을 구현하지 않을 거라면 굳이 text만 따로 저장할 필요는 없다.
    // description.trim()
    axios.put('http://localhost:5000/board/update', {
      _id: params,
      title: document.getElementById('update_title').value, // 이 부분은 해결되었지만, 최적화해야할 과제 기존 data.title -> 해당 방식
      content: description,
      realContent: data.realContent,
      imgData: imgData,
      threeD: data.threeD
    })
    .then((res) => {
      successMessage("수정되었습니다!!");
      navigate(-1);
    })
    .catch((e) => {
      errorMessage("에러!!");
    });  
  };
  function modifyCancel() {
    navigate(-1);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-editor">
      <input
            type="text"
            placeholder="Title"
            id="update_title"
            value={data.title}
            onChange={(e) => setData((prevState) => ({ ...prevState, title: e.target.value }))}
            required
        />
      <EditorToolBar />
      <ReactQuill
        theme="snow"// 테마 설정 (여기서는 snow를 사용)
        value={data.realContent}
        onChange={handleChange}
        ref={quillRef}
        modules={modules}
        formats={formats}
      />
      <div className="ThreeD-Views"></div>
      <Button variant="contained" type="submit">저장하기</Button>
      <Button variant="contained" onClick = {modifyCancel}>취소하기</Button>
      <ToastContainer
            limit={1}
            autoClose={2000}
            /*
            position="top-right"
            limit={1}
            closeButton={false}
            autoClose={2000}
            hideProgressBar
            */
        />
    </div>
    </form>
  );
};

export default MyEditor;