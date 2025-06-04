import React from "react";
import { useEffect } from "react";

function Table() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editValue, setEditValue] = React.useState("");
  // const [changeLog, setChangeLog] = React.useState(null);
  const [editedRows, setEditedRows] = React.useState({});

  useEffect(() => {
    fetch("http://localhost:5000/api/rai")
      .then((res) => res.json())
      .then((resp) => {
        // Make sure to extract the array from the correct property
        const questionData = resp.data?.questionnaries || [];
        const formatted = questionData.map((item, index) => ({
          id: `Q${index + 1}`,
          question: item.question || "No question provided",
          answer: item.answer || "No answer",
          justification: item.justification || "No justification",
        }));
        setData(formatted);
        setLoading(false);

        // Save originals to backend
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

  const handleSave = (index) => {
    const original = data[index].answer;
    const updatedData = [...data];
    updatedData[index].answer = editValue;
    setData(updatedData);

    const question = data[index].question;

    const edited_by = "user@example.com";
    const edited_at = new Date().toISOString();

    // Save to MongoDB (send both original and edited)
    fetch("http://localhost:5000/api/rai/update-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        original_answer: original,
        updated_answer: editValue,
        edited_by,
        edited_at,
      }),
    })
      .then((res) => res.json())
      .then((resp) => {
        console.log("Saved to DB:", resp);
      })
      .catch((err) => {
        console.error("Error saving to DB:", err);
      });
    

    setEditedRows({ ...editedRows, [index]: true });
    setEditingIndex(null);
    setEditValue("");
  };

  const handleChange = (e) => setEditValue(e.target.value);

  return (
    <div style={{ margin: 40 }}>
      <h2>🧠 Responsible AI Questionnaire</h2>
      {loading ? (
        <p className="loading">Loading data...</p>
      ) : data.length === 0 ? (
        <p>No questionnaire responses available.</p>
      ) : (
        <table className="table table-striped table-hover table-bordered mt-4 rounded">
          <thead className="table-light">
            <tr>
              <th>Question</th>
              <th>Answer (Click to Edit)</th>
              <th>Justification</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id}>
                <td>{item.question}</td>
                <td>
                  {editingIndex === index ? (
                    <>
                      <input
                        value={editValue}
                        autoFocus
                        onChange={handleChange}
                        className="form-control d-inline-block w-75"
                      />
                      <button
                        onClick={() => handleSave(index)}
                        className="btn btn-success btn-sm ms-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditValue("");
                        }}
                        className="btn btn-secondary btn-sm ms-2"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={
                          editedRows[index] ? "fw-bold text-success" : ""
                        }
                      >
                        {item.answer}
                      </span>
                      <button
                        onClick={() => handleAnswerClick(index)}
                        className="btn btn-primary btn-sm ms-2"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </td>
                <td>{item.justification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Table;
