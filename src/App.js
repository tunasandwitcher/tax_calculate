import React, {useState} from 'react';
import * as XLSX from 'xlsx';
import {useDropzone} from 'react-dropzone';
import master_data from './market_price_btc.json';
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import 'bootstrap/dist/css/bootstrap.min.css';
import dayjs from 'dayjs';


function App() {
  const [watt, watt_text] = useState("");
  const [time, time_text] = useState("");
  const [cost, cost_text] = useState("");
  const [drop_list,drop_text] = useState([]);

  const diode = (data) => {
    const dyo2_  = []
    const drop = data.filter(item => Number(item["Amount (BTC)"]) > 0)
    Promise.resolve(drop)
    .then((drop) =>{
      var list_ = {}
      for(var i = 0; i < drop.length; i++ ){
        list_["Date time"]   = dayjs(drop[i]["Date time"].split(" ")[0].replace(/-/g, "/")).format('YYYY/M/D')
        list_["Amount (BTC)"] = drop[i]["Amount (BTC)"]
        dyo2_.push(list_)
        list_ = {}
      }
      Promise.resolve(dyo2_)
      .then((data) => {
        drop_text(data)
      })
    })
  }

  const dowload = () => {
    const dow_list = []
    const market_price_btc = []
    for(var i =0; i < drop_list.length; i++){
      market_price_btc.push(master_data[drop_list[i]["Date time"]]["BTC/JPY"])
    }
    Promise.resolve(market_price_btc)
    .then((market_price_btc) => {
    var dow_obj = {};
    for(var i = 0; i< drop_list.length; i++){
      dow_obj.Date = drop_list[i]["Date time"]
      dow_obj.Amount = drop_list[i]["Amount (BTC)"]
      dow_obj.market_price = market_price_btc[i]
      dow_obj.get_price = Math.round(
      drop_list[i]["Amount (BTC)"] * market_price_btc[i]
      )
      dow_obj.cost = cost * (watt /1000) * time
      dow_obj.profit = Math.round(
      (drop_list[i]["Amount (BTC)"] * market_price_btc[i]) - (cost * (watt /1000) * time)
      )
      dow_list.push(dow_obj)
      dow_obj = {}
    }
    })
    Promise.resolve(dow_list)
    .then((dow_list) =>{
    const worksheet = XLSX.utils.json_to_sheet(dow_list);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Date");
    XLSX.utils.sheet_add_aoa(worksheet, [["日付", "取得数量", "評価額","取得額","コスト","利益"]], { origin: "A1" });
    XLSX.writeFile(workbook, "Presidents.csv");
    })  
  }

  const onDrop = (acceptedFiles) => {
    handleFileUpload_(acceptedFiles)
  }

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    noClick: true})
  
  const processData = dataString => {
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
    const list = [];
    for (let i = 1; i < dataStringLines.length; i++) {
      const row = dataStringLines[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
      if (headers && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] === '"')
              d = d.substring(1, d.length - 1);
            if (d[d.length - 1] === '"')
              d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }
        if (Object.values(obj).filter(x => x).length > 0) {
          list.push(obj);
        }
      }
    }
    diode(list)
  }

  const handleFileUpload_ = e => {
    const file = e[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, {type: 'binary',cellDates:true,cellText:false});
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonopts = {
        header: 1,
        defval: '',
        blankrows: true,
        raw: false,
        dateNF:'YYYY"/"M"/"D'
      }
      const data = XLSX.utils.sheet_to_csv(ws, jsonopts);
      processData(data);
    };
    reader.readAsBinaryString(file);
  }

  
return (
<div> 
  <div className="title">
  NiceHashで生成できるCSVファイルから、納税の際に参考になる資料をエクセル形式で生成します<br/>
  </div>
  <div className ="text-danger">
  ＊NiceHashでファイルを生成する際には　・Time aggregationをDAY　・Time zoneは東京を選択して下さい<br/>
  ＊ビットコインの評価額は、ビットフライヤーでの取引所の終値を参考にしています<br/>
  </div>
  <div className ="inner">
    マイニングリグの使用電力
    <div className="text-primary">
    <FloatingLabel controlId="floatingInput" label="250wの場合）250" className="mb-3"
    value={watt} placeholder="" onChange={(event) => watt_text(event.target.value)}
    >
      <Form.Control type="number"/>
    </FloatingLabel>
    </div>
    一日の使用時間
    <div className="text-primary">
    <FloatingLabel controlId="floatingPassword" label="24時間使用している場合）24"
    value={time}onChange={(event) => time_text(event.target.value)}
    >
    <Form.Control type="number"/>
    </FloatingLabel>
    </div>
    1kWhあたりの電気代
    <div className="text-primary">
    <FloatingLabel controlId="floatingPassword" label="関西電力の場合27円なので）27"
    value={cost}onChange={(event) => cost_text(event.target.value)}
    >
    <Form.Control type="number"/>
    </FloatingLabel>
    </div>
  </div>
  <div className = "drop-area" {...getRootProps()}>
    <input {...getInputProps()}/>
    {isDragActive ?
      <p>nicehashのCSVファイルをドラッグ</p> :
      <p>nicehashのCSVファイルをドラッグ</p>
    }
  </div>
  <div className = "btn-center">
    <button id="dow" onClick={dowload} disabled={!time | !watt | !cost | !drop_list.length}>ダウンロード</button>
  </div>
</div>
);
}

export default App;