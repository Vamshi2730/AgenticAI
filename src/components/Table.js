import React from "react";
import { useEffect } from "react";

function Table() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editValue, setEditValue] = React.useState("");
  const [editedRows, setEditedRows] = React.useState({});
  const [ackChecked, setAckChecked] = React.useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/rai")
      .then((res) => res.json())
      .then((resp) => {
        const questionData = resp.data?.questionnaries || [];
        const formatted = questionData.map((item, index) => ({
          id: `Q${index + 1}`,
          question: item.question || "No question provided",
          answer: item.answer || "No answer",
          justification: item.justification || "No justification",
        }));
        setData(formatted);
        setLoading(false);

        fetch("http://localhost:5000/api/rai/original-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: formatted }),
        });
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  const handleAnswerClick = (index) => {
    setEditingIndex(index);
    setEditValue(data[index].answer);
  };

  const handleEditChange = (e, index) => {
    const updatedData = [...data];
    updatedData[index].answer = e.target.value;
    setData(updatedData);
    setEditedRows({ ...editedRows, [index]: true });
  };

  const handleSubmit = () => {
 
    const editedData = Object.keys(editedRows).map((idx) => {
      const index = parseInt(idx, 10);
      return {
        question: data[index].question,
        updated_answer: data[index].answer,
        edited_by: "user@example.com",
        edited_at: new Date().toISOString(),
      };
    });

  
    fetch("http://localhost:5000/api/rai/bulk-update-answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edits: editedData }),
    })
      .then((res) => res.json())
      .then((resp) => {
         window.location.href = "https://cpd-watsonx-dcmdevwsnocp.ad.infosys.com/openpages-op-wxgov-instance/app/jspview/react/grc/dashboard/Home";
      })
      .catch((err) => {
        console.error("Error saving to DB:", err);
      });
  };

  return (
    <div style={{ margin: 40 }}>
      <h2>🧠 Responsible AI Questionnaire</h2>
      {loading ? (
        <p className="loading">Loading data...</p>
      ) : data.length === 0 ? (
        <p>No questionnaire responses available.</p>
      ) : (
        <>
          <table className="table table-striped table-hover table-bordered mt-4 rounded">
            <thead className="table-light">
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Justification</th>
                <th>Action</th>
              </tr>
            </thead>
          <tbody>
  {data.map((item, index) => (
    <tr key={item.id}>
      <td>{item.question}</td>
      <td>
        {editingIndex === index ? (
          <input
            value={item.answer}
            autoFocus
            onChange={(e) => handleEditChange(e, index)}
            className="form-control d-inline-block w-75"
            onBlur={() => setEditingIndex(null)}
          />
        ) : (
          <span className={editedRows[index] ? "fw-bold text-success" : ""}>
            {item.answer}
          </span>
        )}
      </td>
      <td>{item.justification}</td>
      <td>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleAnswerClick(index)}
        >
          Edit
        </button>
        {/* {editedRows[index] && (
          <span className="fw-bold text-success ms-2">Edited</span>
        )} */}
      </td>
    </tr>
  ))}
</tbody>
          </table>
          <div className="mt-3">
            <input
              type="checkbox"
              id="acknowledge"
              checked={ackChecked}
              onChange={(e) => setAckChecked(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <label htmlFor="acknowledge">
             I hereby acknowledge that I have reviewed the Responsible AI assessment report. I confirm my understanding and acceptance of the findings and recommendations provided in this report. Should there be any comments or concerns, I commit to communicating with Responsible AI team in 3 business days. In the absence of such communication, this assessment will be considered fully accepted.
            </label>
          </div>
          <button
            className="btn btn-primary mt-3"
            disabled={!ackChecked || Object.keys(editedRows).length === 0}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
}

export default Table;