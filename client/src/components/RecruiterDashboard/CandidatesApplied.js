import { useEffect, useState } from "react";
import ProfileCard from "./profileCard";


const stageBadgeColors = {
  Applied:"#ab21df",
  Hired: "#43dc3e",
  Screening: "#4b78f1",
  Interview: "#ede237",
  Rejected: "#df2147",
};


const CandidatesApplied=()=> {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateRange, setDateRange] = useState("last30");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null); // State for selected candidate
  const [candidates, setCandidates] = useState([])
  const itemsPerPage = 10;
  const totalPages = Math.ceil(candidates.length / itemsPerPage);

  useEffect(() => {
    //log data
    console.log('Fetching candidates from API...');
    // Fetch candidates from the API

      const getCandidates=async()=>{
        try{
          const response=await fetch('http://localhost:3001/api/jobApplications/all');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          console.log("response",response);
          const data=await response.json();
          console.log("Data from API",data);
          setCandidates(data.appliedApplications);
        }
        catch(error){
          console.error('Error fetching candidates:', error)
        }
      }
     getCandidates();
     return () => {
      console.log("Component unmounted");
    };
     }, []);

     useEffect(() => {
      console.log("Updated candidates:", candidates);
    }, [candidates]);


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleCheckboxChange = (candidate) => {
    setSelectedCandidate(candidate); // Set the selected candidate
  };

  const filteredCandidates = candidates
    .filter((candidate) =>
      `${candidate.userName} ${candidate.appliedRole}`
        .toLowerCase()
        .includes(searchQuery)
    )
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.userName.localeCompare(b.userName)
        : b.appliedRole.localeCompare(a.appliedRole)
    );

  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  //write function formatting appliedDate
  function formatAppliedDate(dateString){
    const date=new Date(dateString);

    const day=String(date.getDate()).padStart(2,'0');
    const monthIndex=date.getMonth();
    const year=date.getFullYear();

    const monthNames=["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month=monthNames[monthIndex];

    return `${day} ${month}, ${year}`;
  }

  //function for random index from given array
  const array=[
    "https://i1.rgstatic.net/ii/profile.image/684563537874945-1540224074030_Q512/George-Hibberd.jpg",
    "https://th.bing.com/th/id/OIP.HoSfYat7O0wkLfp50qLlFgHaHa?rs=1&pid=ImgDetMain",
    "https://avatars.githubusercontent.com/u/12557112?v=4?s=400",
    "https://th.bing.com/th/id/OIP.2i5UaEHaQM3PYAYXQyM1AAAAAA?rs=1&pid=ImgDetMain"
  ]
  function candidateAvatar(array){
    const arrayIndex=Math.floor(Math.random()*array.length)
    return array[arrayIndex];
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Sidebar for Selected Candidate Details */}
      <h1 className="heading">Candidates</h1>
      {selectedCandidate && (
        <div className="sidebar fixed top-0 right-0 w-1/3 h-full bg-white shadow-lg p-4 z-10">
        <ProfileCard
          candidate={selectedCandidate}
          stageBadgeColors={stageBadgeColors}
          formatAppliedDate={formatAppliedDate}
          onClose={() => setSelectedCandidate(null)}
        />
      </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/3 relative">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* Sort and Date Range */}
        <div className="flex flex-wrap justify-end items-center gap-2">
          <select
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded"
            value={sortOrder}
          >
            <option value="asc">Sort A-Z</option>
            <option value="desc">Sort Z-A</option>
          </select>

          <select
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded"
            value={dateRange}
          >
            <option value="last30">Last 30 days</option>
            <option value="last60">Last 60 days</option>
            <option value="last90">Last 90 days</option>
          </select>

          <button className="px-4 py-2 border border-gray-300 rounded bg-gray-100">
            Export Data
          </button>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Select</th>
              <th className="px-4 py-2">Applied Role</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Candidates</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Applied Date</th>
              <th className="px-4 py-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCandidates.map((candidate) => (
              <tr key={candidate.id} className="border-t">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange(candidate)}
                  />
                </td>
                <td className="px-4 py-2 text-blue-500 font-bold">{candidate.appliedRole}</td>
                <td className="px-4 py-2 text-black">{candidate.appliedLocation}</td>
                <td className="px-4 py-2 flex items-center text-black">
                  <img
                    src={candidateAvatar(array)}
                    alt={`${candidate.userName}'s avatar`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="font-medium text-black">{candidate.userName}</div>
                    <div className="text-sm text-gray-500 text-black">
                      {candidate.userEmail}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-black">{candidate.userPhone}</td>
                <td className="px-4 py-2 text-black">{formatAppliedDate(candidate.appliedDate)}</td>
                <td className="px-4 py-2 text-black">
                  <span
                    className={`px-2 py-1 rounded`}
                    style={{
                      border: `2px solid ${stageBadgeColors[candidate.applicationStage]}`,
                      color: stageBadgeColors[candidate.applicationStage],
                      backgroundColor: `${stageBadgeColors[candidate.applicationStage]}12`,
                      fontWeight: "bold",
                    }}
                  >
                    {candidate.applicationStage}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidatesApplied;