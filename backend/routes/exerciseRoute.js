const express= require('express');
const {ExerciseModel}=require("../models/exerciseModel")
const authMiddle=require("../middleware/authMiddleware")
const exerciseRouter=express.Router();




exerciseRouter.get("/",authMiddle,async(req,res)=>{
const {userID}=req.body;
    const data= await ExerciseModel.findOne({userID})
    console.log(data);
    res.send({"data":data.dailyData})
})

exerciseRouter.post("/add", authMiddle, async (req, res) => {
    const { userID, calories, exercise } = req.body;

    try {
        let existingData = await ExerciseModel.findOne({ userID });

        if (existingData) {
            // Data exists, update exercise array
            const formattedDate = getFormattedDate(new Date()); // Pass the current date
            const existingDailyData = existingData.dailyData.get(formattedDate);

            if (existingDailyData) {
                existingDailyData.exercise.push(...exercise);
                existingDailyData.calories += calories;
               
            } else {
                existingData.dailyData.set(formattedDate, { calories, exercise: exercise });
            }

            await existingData.save();
        } else {
            // Data does not exist, create a new entry
            const newData = new ExerciseModel({
                userID,
                dailyData: new Map([[getFormattedDate(new Date()), { calories, exercise: exercise }]])
            });
            await newData.save();
        }

        res.status(200).json({ message: "Data added successfully" });
    } catch (error) {
        console.error(error); // Log the specific error for debugging
        res.status(500).json({ error: "An error occurred" });
    }
});




// Function to get formatted date in "YYYY-MM-DD" format
function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


exerciseRouter.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { exercise,calories } = req.body; // Assuming you want to remove the specified exercise
        
        const exerciseDocument = await ExerciseModel.findById(id);

        if (!exerciseDocument) {
            return res.status(404).json({ success: false, message: "Exercise not found" });
        }

        const formattedDate = getFormattedDate(new Date()); // Pass the current date
        const exerciseArray = exerciseDocument.dailyData.get(formattedDate).exercise;
        const newExerciseArray = exerciseArray.filter((el) => el !== exercise[0]);
        const caloriesBurned = exerciseDocument.dailyData.get(formattedDate).calories-calories;
        // Update the exercise array in the document and save it
        exerciseDocument.dailyData.get(formattedDate).exercise = newExerciseArray;
        exerciseDocument.dailyData.get(formattedDate).calories=caloriesBurned;
        await exerciseDocument.save();

        res.json({ success: true, message: "Exercise deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
});


module.exports = {exerciseRouter}

