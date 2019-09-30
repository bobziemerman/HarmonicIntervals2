
//TODO missing PE and teacher data for (W?)

var app = angular.module('harmonicIntervals', ['isteven-multi-select']);
app.controller('main', function($scope) {

    $scope.schools = JSON.parse(JSON.stringify(schoolData));
    $scope.school = $scope.schools['tulipGrove']; //Default to TG
console.log('$scope.school:');
console.log($scope.school);
    $scope.teachers = JSON.parse(JSON.stringify(teacherData__TG)); //Default to TG
console.log($scope.teachers);
    $scope.computedSchedule = [];
    //new ClipboardJS('#js-copy-to-clipboard'); //Set up 'copy to clipboard' element

    $scope.days = []; //Allows day toggle
    _.each(_.keys($scope.school.schedule), function(day){
        $scope.days[day] = $scope.school.schedule[day].defaultActive;
    });

    $scope.timeslotWarnings = function(timeslot, ig){
        var warnings = [];
        var grades = ig.grades;

        _.each(timeslot.inactiveGrades, function(grade){
            if(grades.includes(grade)){
                warnings.push(grade + ' grade not allowed now');
            }
        });
        _.each(timeslot.lunchGrades, function(grade){
            if(grades.includes(grade)){
                warnings.push(grade + ' grade has lunch');
            }
        });
        _.each(timeslot.mathGrades, function(grade){
            if(grades.includes(grade)){
                var missed = false;
                _.each($scope.missedMathState, function(miss){
                    if(miss.name === ig.name){
                        missed = true;
                    }
                });

                if(missed){
                    warnings.push(ig.name+" cannot miss math two weeks in a row");
                } else {
                    warnings.push(grade + ' grade has math');
                }
                
            }
        });
        _.each(timeslot.peTeachers, function(teacher){
            if(ig.teacher === teacher){
                warnings.push($scope.teachers[teacher].name + "'s class has PE");
            }
        });
        _.each(timeslot.recessGrades, function(grade){
            if(grades.includes(grade)){
                warnings.push(grade + ' grade has recess');
            }
        });

        return warnings.join('; ');
    }
    
    $scope.groupsAvailable = function(timeslot){
    	var retValue = '';
    	if(timeslot && timeslot.busyTeachers !== undefined){
    		_.each($scope.school.instrumentGroups, function(ig){
    			var groupFree = true;
    			_.each(timeslot.busyTeachers, function(teacher){
    				_.each(ig.teachers, function(igTeacher){
    					if(teacher === igTeacher){
    						groupFree = false;
    					}
    				});
    			});
    			
    			if(groupFree){
    				retValue += (retValue === '' ? ig.name : ', '+ig.name);
    			}
    		});
    	}
    	return retValue;
    }
    
    /*
     * Green = 1
     * Light Red = 2
     * Dark Red = 3
     */
    $scope.openTimeslot = function(day, timeslot, instrumentGroup){
    	var green = 1;
    	var lightRed = 2;
    	var red = 3;
    	
    	if(day && timeslot && instrumentGroup && timeslot.busyTeachers !== undefined && instrumentGroup.teachers !== undefined){
    		//If group is unavailable, mark it as red
    		if(!$scope.groupsAvailable(timeslot).includes(instrumentGroup.name)){
    			return red;
    		}
    		
    		//If this group has already met twice or more, mark them as red
    		if($scope.lessonCount(instrumentGroup.name) >1){
    			return red;
    		}
    		
    		//If this timeslot is already filled, mark it as red
    		if($scope.computedSchedule[day+timeslot.startTime]){
    			return red;
    		}
    		
    		//If this group is already assigned for today, mark it as red
    		var returnRed = false;
    		_.each(_.keys($scope.computedSchedule), function(scheduleSlot){
    			if(!scheduleSlot.includes(timeslot.startTime) && scheduleSlot.includes(day)){
    				if($scope.computedSchedule[scheduleSlot][instrumentGroup.name])
    					returnRed = true;
    			}
    		});
    		if(returnRed)
    			return red;
    		
    		//If this group has already met at this time this week, mark them as red
    		_.each(_.keys($scope.computedSchedule), function(scheduleSlot){
    			if(scheduleSlot.includes(timeslot.startTime) && !scheduleSlot.includes(day)){
    				if($scope.computedSchedule[scheduleSlot][instrumentGroup.name])
    					returnRed = true;
    			}
    		});
    		if(returnRed)
    			return red;
    		
    		//If this slot isn't dark red and is a maybe, assign light red
    		_.each($scope.school.instrumentGroups[instrumentGroup.id].teachers, function(teacher){
	    		if($scope.school.schedule[day].timeslots[timeslot.startTime].maybeTeachers.indexOf(teacher) > -1){
	    			returnRed = true;
	    		}
    		});
    		if(returnRed)
    			return lightRed
    		
    		//Otherwise, return green
    		return green;
    	}
    	
    	//If we don't know enough about the timeslot.group, mark it as red
		return red;
    }
    
    $scope.toggleScheduleTeacherMaybe = function(day, timeslot, teacherKey){
    	var idx = timeslot.maybeTeachers.indexOf(teacherKey);
    	if(idx > -1){
    		timeslot.maybeTeachers.splice(idx, 1);
    	} else{
    		timeslot.maybeTeachers.push(teacherKey);
    	}
    }
    
    $scope.toggleScheduleTeacher = function(day, timeslot, teacherKey){
    	var idx = timeslot.busyTeachers.indexOf(teacherKey);
    	if(idx > -1){
    		timeslot.busyTeachers.splice(idx, 1);
    	} else{
    		timeslot.busyTeachers.push(teacherKey);
    	}
    }
    
    $scope.scheduleCheckTeacherMaybe = function(timeslot, teacherKey){
    	var retValue = true;
    	if(timeslot && teacherKey){
    		retValue = !(timeslot.maybeTeachers.indexOf(teacherKey) > -1);
    	}
    	
    	return retValue;
    }
    
    $scope.scheduleCheckTeacher = function(timeslot, teacherKey){
    	var retValue = false;
    	if(timeslot && teacherKey){
    		retValue = !(timeslot.busyTeachers.indexOf(teacherKey) > -1);
    	}
    	
    	return retValue;
    }
    
    
    $scope.toggleScheduleIGMaybe = function(day, timeslot, ig){
    	_.each(ig.teachers, function(teacher){
    		$scope.toggleScheduleTeacherMaybe(day, timeslot, teacher);
    	});
    }
    
    $scope.toggleScheduleIG = function(day, timeslot, ig){
    	_.each(ig.teachers, function(teacher){
    		$scope.toggleScheduleTeacher(day, timeslot, teacher);
    	});
    }
    
    $scope.scheduleCheckIGMaybe = function(timeslot, ig){
    	var retValue = true;
    	_.each(ig.teachers, function(teacher){
    		//If any teacher is a maybe, the whole group is
    		if(!$scope.scheduleCheckTeacherMaybe(timeslot, teacher)){
    			retValue = false;
    		}
    	});
    	
    	return retValue;
    }
    
    $scope.scheduleCheckIG = function(timeslot, ig){
    	var retValue = true;
    	_.each(ig.teachers, function(teacher){
    		//If any teacher is unavailable, the whole group is
    		if(!$scope.scheduleCheckTeacher(timeslot, teacher)){
    			retValue = false;
    		}
    	});
    	
    	return retValue;
    }
    
    
    
    

    //Checkbox toggle functions
    $scope.toggleGrade = function(dayName, timeslotName, gradeName){
        if($scope.school.schedule[dayName][timeslotName].inactiveGrades.includes(gradeName)){
                $scope.school.schedule[dayName][timeslotName].inactiveGrades =
                    _.without($scope.school.schedule[dayName][timeslotName].inactiveGrades, gradeName);
        } else {
            $scope.school.schedule[dayName][timeslotName].inactiveGrades.push(gradeName);
        }
    };
    $scope.toggleAllGrade = function(dayName, gradeName){
        var allChecked = $scope.checkAllGrade(dayName, gradeName);
        _.each($scope.school.schedule[dayName], function(timeslot){
            if(allChecked){
                timeslot.inactiveGrades = _.without(timeslot.inactiveGrades, gradeName);
            } else {
                timeslot.inactiveGrades.push(gradeName);
            }
        });
    };

    $scope.lessonCount = function(igName){
        var lessonCount = 0;

        _.each(_.values($scope.computedSchedule), function(checkedTimeslot){
            _.each(_.keys(checkedTimeslot), function(tsIgName){
                if(checkedTimeslot[igName] && tsIgName === igName){
                    lessonCount++;
                }
            });
        });

        return lessonCount;
    }

    //TODO rewrite
    $scope.missingMath = function(){
        var arr = [];
        _.each(_.keys($scope.school.schedule), function(day){
            _.each(_.keys($scope.school.schedule[day]), function(timeslot){
                _.each($scope.school.instrumentGroups, function(ig){
                    var startTime = $scope.school.schedule[day][timeslot].startTime;

                    //If box is checked
                    if($scope.computedSchedule[day+startTime] && 
                       $scope.computedSchedule[day+startTime][ig.name]){

                        //If math at this time TODO
                        arr.push(ig.name);
                    }
                });
            });
        });
        return JSON.stringify(arr);
    };

    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    //Create clipboard button listener
    new ClipboardJS('.btn');

    //Watch for school change
    $scope.$watch('school', function(){
        //Change teachers
        teacherData = $scope.school.name.includes('Woodmore') ? 
            JSON.parse(JSON.stringify(teacherData__W)) : 
            JSON.parse(JSON.stringify(teacherData__TG)); 

        $scope.missedMath = _.values(JSON.parse(JSON.stringify($scope.school.instrumentGroups)));
    }, true);

    //Watch for code input
    $scope.$watch('mathGroups', function(){
        if($scope.mathGroups && isJsonString($scope.mathGroups)){
            _.each(JSON.parse($scope.mathGroups), function(mGroup){
                _.each($scope.school.instrumentGroups, function(ig){
                    if(ig.name === mGroup){
                        _.each($scope.missedMath, function(mIg){
                            if(mIg.name === mGroup){
                                mIg.checked = true;
                            }
                        });
                    }
                });
            });
        } else {
            _.each($scope.missedMath, function(mIg){
                mIg.checked = false;
            });
        }
    });

});

