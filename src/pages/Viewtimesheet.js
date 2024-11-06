import React, { useState, useEffect } from 'react';
import "../App.css"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { Interval, DateTime } from "luxon";
import TextField from '@mui/material/TextField';
import { makeStyles, withStyles } from "@material-ui/core/styles";
import TableHead from '@material-ui/core/TableHead';
import { Alert, Button, IconButton, Stack, TableFooter } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowLeftIcon from '@mui/icons-material/ArrowBackIos';
import Typography from "@material-ui/core/Typography";
import { NotificationContainer, NotificationManager } from 'react-notifications';
import CircularProgress from '@mui/material/CircularProgress';
import sampleData from "../_mock/timesheet.json";
import axios from 'axios';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import Hidden from '@material-ui/core/Hidden';
import config from "../Config.json";


const TableHeaderCell = withStyles((theme) => ({
    root: {
        backgroundColor: "rgb(216,242,81)",
        color: "black"
    }
}))(TableCell);


const useStyles = makeStyles(theme => ({
    dateLg: {
        padding: theme.spacing(1),
        [theme.breakpoints.up('sm')]: {
            display: "block",
            fontSize: '1.4rem',
        },
    },
    dateSm: {
        padding: theme.spacing(1),
        [theme.breakpoints.up('sm')]: {
            display: "none",
            fontSize: '1rem'
        },
    },

}));

const addWeeks = (date, weeks) => {
    return DateTime.fromJSDate(date).plus({ weeks }).toJSDate();
};
export default function Viewtimesheet({ email, currentProject, cstartdate, cenddate, cstartnumeric, cendnumeric, cintervals }) {

    const [updatedhoursData, setUpdatedHoursData] = useState({});
    const [currentstartdate, setCurrentstartdate] = useState(cstartdate);
    const [currentenddate, setCurrentenddate] = useState(cenddate);
    const [weeknumber, setWeeknumber] = useState(Math.round((DateTime.now().ordinal / 7)) - 1);
    const [weekyear, setWeekYear] = useState(parseInt(DateTime.now().toFormat('yyyy')));
    const [currentintervals, setcurrentIntervals] = useState(cintervals)
    const [projectlist, setProjectlist] = useState([])
    const [hoursData, setHoursData] = useState({});
    const [loader, setLoader] = useState(true)
    const [val, setVal] = useState(1);
    const [profiledata, setProfiledata] = useState({});
    const [state, setState] = useState([]);
    const [numberOfDaystoShow, setnumberOfDaystoShow] = useState(6)
    const isDesktop = (window.innerWidth > window.innerHeight);
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const mail = email;
    const [currentstartdatenumeric, setCurrentstartdatenumeric] = useState(cstartnumeric);
    const [currentenddatenumeric, setCurrentenddatenumeric] = useState(cendnumeric);
    const [timeSheetData, setTimeSheetData] = useState({});

    const profileEmail = email;
    const UProjectName = currentProject;

    const fetchManagerView = async (startDate, endDate) => {
        await fetchTimeSheet(startDate, endDate);
    };

   
    const keyArrowLeft = () => {

        setWeeknumber(weeknumber - 1);
        setVal(val + 1);
        if (val > 1) {
            if ((weeknumber - 1) == true)
                setOpen(true);
        }
        else {
            setOpen(true);
        }
        let currdateEx = currentstartdatenumeric.split("/");
        let currDate = new Date(currdateEx[2] + '-' + currdateEx[0] + '-' + currdateEx[1]);
        console.log("currdate", currDate);
        fetchManagerView(addWeeks(currDate, 1, 'before'), addWeeks(currDate, 1));
    };
    const keyArrowRight = () => {

        setWeeknumber(weeknumber + 1)
        setVal(val + 1);
        if (val > 1) {
            if ((weeknumber + 1) == true)
                setOpen(true);
        }
        else {
            setOpen(true);
        }
        let currdateEx = currentstartdatenumeric.split("/");
        let currDate = new Date(currdateEx[2] + '-' + currdateEx[0] + '-' + currdateEx[1]);
        console.log("currDates", currDate);
        fetchManagerView(addWeeks(currDate, 1), addWeeks(currDate, 1));

    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < window.innerHeight) {
                setnumberOfDaystoShow(4);
            }
            if (window.innerWidth > window.innerHeight) {
                setnumberOfDaystoShow(numberOfDaystoShow);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        // Cleanup function (return statement)
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);




    useEffect(() => {
        setLoader(true)
        //let weekyear = DateTime.now()
        if (weeknumber < 1) {
            setWeekYear(weekyear - 1);
            setWeeknumber(52);
        }
        if (weeknumber === 53) {
            setWeekYear(weekyear + 1);
            setWeeknumber(1);
        }
        const weekRangeObject = DateTime.fromObject({
            weekYear: weekyear,
            weekNumber: weeknumber
        })


        let projects = [];
        let filteredHoursData = {};
        let ordinalD = '';

        console.log("intervals", currentintervals)
        if (Object.keys(timeSheetData).length > 0 && timeSheetData[0].projects) {
            console.log("imhere");
            if (timeSheetData[0].email == '') {
                setProjectlist('');
                setLoader(false);
            }
            else {
                timeSheetData[0].projects.forEach(timeSheet => {
                    if (timeSheet.name === UProjectName) {
                        ordinalD = timeSheet.date.split("-")[2];
                        if (!filteredHoursData[timeSheet.name]) {
                            filteredHoursData[timeSheet.name] = {};
                        }
                        if (!filteredHoursData[timeSheet.name][timeSheetData[0].email]) {
                            filteredHoursData[timeSheet.name][timeSheetData[0].email] = {};
                        }
                        if (!filteredHoursData[timeSheet.name][timeSheetData[0].email][timeSheet.date]) {

                            filteredHoursData[timeSheet.name][timeSheetData[0].email][ordinalD] = 0;
                        }
                        filteredHoursData[timeSheet.name][timeSheetData[0].email][ordinalD] = timeSheet.hours + "/" + timeSheet.status;
                        // });
                        projects.push(timeSheet.name);
                    }
                });
                //});
                console.log('filtered hours', filteredHoursData);
                projects = [...new Set(projects)];
                console.log("projects", projects);
                setProjectlist(projects);
                setHoursData(filteredHoursData);
                setLoader(false);

                let end_date = weekRangeObject.startOf('week').plus({ days: numberOfDaystoShow }).toFormat('MM/dd/yyyy');
                // console.log("profiledatas",tokenProfileData.userPrincipalName);
                if (currentstartdatenumeric && end_date) {
                    //fetchTimeSheet(currentstartdatenumeric, end_date, mail);
                }
            }
        } else {
            // setLoader(false);
            // setMessage(true)
            // setLoader(false);
            //setTimeSheetData('');
        }

    }, [weeknumber, numberOfDaystoShow, timeSheetData]);


    useEffect(() => {

        const fetchTimeSheet = async () => {
            console.log("api calling......", profiledata);
            const weekRangeObject = DateTime.fromObject({
                weekYear: weekyear,
                weekNumber: weeknumber
            })

            const body = {
                email: profileEmail,
                ordinalFrom: currentstartdatenumeric,
                ordinalTo: currentenddatenumeric
            }

            console.log('body send', body);

            try {
                //let k = 'getManagerResourceTimesheet';//getMyTimesheet
                const response = await axios.get(`${config.azureApiUrl}/api/getMyTimesheet`,
                    {
                        params: body
                    }).then(response => {
                        //console.log("responsetimesheet", sampleData2);
                        console.log("myresponse", response.data);
                        //setTimeSheetData(response.data);
                        if (response.data) {
                            setTimeSheetData(response.data);
                        } else {
                            setLoader(false);
                        }
                        // console.log("xyz", xyz);
                    })
            } catch (error) {
                console.log(error);
            }
        };
        //  tokenApi();
        // fetchProfile();
        fetchTimeSheet();
    }, []);


    const fetchTimeSheet = async (start_date, end_date, email = '', postCheck = '') => {

        let revised_end_date;
        if (postCheck != 1) {

            let currdateEx = end_date.split("/");
            let currDate = new Date(currdateEx[2] + '-' + currdateEx[0] + '-' + currdateEx[1]);
            let revised_date = currDate.getDate() - 1;
            console.log('revised_date', revised_date);

            console.log('ordinalTo', end_date)
            console.log('currentstartdatenumeric', currentstartdatenumeric)
            console.log('currentenddatenumeric', currentenddatenumeric)
            revised_end_date = currdateEx[0] + '/' + revised_date + '/' + currdateEx[2];
            console.log('revised_end_date', revised_end_date);
        } else {
            revised_end_date = end_date;
        }


        const body = {
            email: profileEmail,
            ordinalFrom: start_date,
            ordinalTo: revised_end_date
        }

        console.log('body send', body);

        try {
            const response = await axios.get(`${config.azureApiUrl}/api/getMyTimesheet`,
                {
                    params: body
                }).then(response => {
                    console.log("responsetimesheet", response.data);
                    if (response.data) {
                        setTimeSheetData(response.data);
                    } else {
                        setLoader('" No Project found" Please contact your Manager');
                    }
                    //setTimeSheetData(response.data);
                    // console.log("xyz", xyz);
                })
        } catch (error) {
            console.log(error);
        }

    };


    const handleSave = (event, rowProject, email, Ordinal, rowDate) => {
        let hours = Number(event.target.value);
        let year = new Date().getFullYear();

        if (hours < 0) {
            alert("Invalid Hours");
            let originalValue = hoursData[rowProject] && hoursData[rowProject][email] && hoursData[rowProject][Ordinal] ? hoursData[rowProject][email][Ordinal] : '';
            if (originalValue < 0) {
                originalValue = '';
            }
            let updatedHoursData = { ...hoursData };
            if (!updatedHoursData[rowProject]) {
                updatedHoursData[rowProject] = {};
            }
            if (!updatedHoursData[rowProject][email]) {
                updatedHoursData[rowProject][email] = {};
            }
            updatedHoursData[rowProject][email][Ordinal] = originalValue;
            setHoursData(updatedHoursData);
        } else {
            let updatedHoursData = { ...hoursData };
            if (!updatedHoursData[rowProject]) {
                updatedHoursData[rowProject] = {};
            }
            if (!updatedHoursData[rowProject][email]) {
                updatedHoursData[rowProject][email] = {};
            }
            updatedHoursData[rowProject][email][Ordinal] = event.target.value;

            setHoursData(updatedHoursData);

            setState(prevUpdatedHours => [
                ...prevUpdatedHours,
                [rowProject, email, Ordinal, year, hours]
            ]);
        }
    };


    return (
        <>
            <Box //This is the Header Section Box , Houses Controls Only , Enable Disable For Other Views with a Prop
                sx={{
                    p: 1,
                    bgcolor: (theme) =>
                        theme.palette.mode === "dark" ? "#101010" : "#fff",
                    color: (theme) =>
                        theme.palette.mode === "dark" ? "grey.300" : "grey.800",
                    border: "1px solid",
                    borderColor: (theme) =>
                        theme.palette.mode === "dark" ? "grey.800" : "grey.300",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        flexDirection: "row",
                        justifyContent: "center",
                    }}
                >
                    {/* <IconButton
                        color="primary"
                        size="large"
                        aria-label="upload picture"
                        component="label"
                        onClick={() => { keyArrowLeft() }}
                    >
                        <KeyboardArrowLeftIcon
                            sx={{
                                color: (theme) => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800'
                            }}
                        />
                    </IconButton> */}
                    <Hidden smDown>
                        <Typography
                            className={classes.dateLg}
                            style={{
                                color: theme => (theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800'),
                                paddingTop: '6px',
                                paddingLeft: '8px',
                                paddingRight: '8px',
                                border: '2px solid',
                                borderRadius: '5px',
                                display: 'inline-block'
                            }}
                            variant="subtitle1"
                        >
                            {currentstartdate} to {currentenddate}
                        </Typography>
                    </Hidden>

                    <Hidden mdUp>
                        <Typography
                            className={classes.dateSm}
                            style={{
                                color: theme => (theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800'),
                                paddingTop: '6px',
                                paddingLeft: '8px',
                                paddingRight: '8px',
                                border: '2px solid',
                                borderRadius: '5px',
                                display: 'inline-block'
                            }}
                            variant="subtitle2"
                        >
                            {currentstartdate} to {currentenddate}
                        </Typography>
                    </Hidden>
                    {/* <IconButton
                        color="primary"
                        size="large"
                        aria-label="upload picture"
                        component="label"
                        onClick={() => { keyArrowRight() }}
                    >
                        <KeyboardArrowRightIcon
                            sx={{
                                color: (theme) =>
                                    theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800',
                            }} />
                    </IconButton> */}
                </Box>
            </Box>

            <TableContainer component={Paper} >
                {loader ? (
                    <CircularProgress />
                ) : projectlist ? (

                    <Table sx={{ minWidth: 650 }} aria-label="timesheet-table">
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell align="center">Projects</TableHeaderCell>
                                {currentintervals.map(rowDate =>
                                    <TableHeaderCell align="center" key={rowDate}>{rowDate}</TableHeaderCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projectlist.map(rowProject => {
                                console.log("rowProject", rowProject)
                                console.log("hoursData", hoursData[rowProject])
                                return (
                                    <TableRow key={[rowProject]}>
                                        <TableCell key={[rowProject]} component="th" align="center">{rowProject}</TableCell>
                                        {currentintervals.map(rowDate => {
                                            let date = rowDate.split(' ')[0];
                                            let dateParts = date.split('/');
                                            let month = Number(dateParts[0]) - 1;
                                            let ordinal = dateParts[1];
                                            let date_year = dateParts[0] + '/' + ordinal + '/' + dateParts[2];
                                            let email = profileEmail;
                                            // console.log("hoursData", hoursData[rowProject][email][ordinal]);
                                            let preHours = hoursData[rowProject] && hoursData[rowProject][email] && hoursData[rowProject][email][ordinal]
                                                ? hoursData[rowProject][email][ordinal] : '';

                                            //console.log("preHours", preHours);
                                            let split_hours = preHours.split("/");
                                            let hours = parseFloat(split_hours[0]);
                                            let freeze_status = split_hours[1];

                                            return (
                                                <TableCell key={[rowProject, rowDate]} component="th" scope="row">
                                                    <TextField id="outlined-basic"
                                                        variant="standard"
                                                        type="number" disabled
                                                        value={hours || ""} />
                                                </TableCell>)
                                        })}
                                    </TableRow>)
                            })}
                            <TableRow>
                                {/* <TableCell align="center">Total</TableCell>
                                {currentintervals.map(rowDate => {
                                    let date = rowDate.split(' ')[0];
                                    let dateParts = date.split('/');
                                    let month = Number(dateParts[0]) - 1;
                                    let ordinal = Number(dateParts[1]);
                                    let year = new Date().getFullYear();
                                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                                    ];
                                    const formattedMonth = monthNames[month];
                                    const formattedDate = `${ordinal}/${formattedMonth}/${year}`;

                                    let email = mail;
                                    let dayTotalHours = 0;
                                    projectlist.forEach(rowProject => {
                                        dayTotalHours += parseFloat(hoursData[rowProject]
                                            && hoursData[rowProject][email]
                                            && hoursData[rowProject][email][ordinal]) || 0;
                                    });
                                    dayTotalHours = Number(dayTotalHours);

                                    return (
                                        <TableCell align="center" key={rowDate}>
                                            {dayTotalHours}
                                        </TableCell>
                                    );

                                })} */}

                            </TableRow>
                        </TableBody>
                    </Table>
                ) : <h2 align="center">" No Project founds" Please contact your Manager</h2>
                }
            </TableContainer>
        </>
    );
}