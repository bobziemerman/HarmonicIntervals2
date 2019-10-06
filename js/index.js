
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
        var teachers = ig.teachers;
        
        //Math 2 weeks
        _.each(timeslot.mathTeachers, function(teacher){
            if(teachers.includes(teacher)){
                var missed = false;
                _.each($scope.missedMathState, function(miss){
                    if(miss.name === ig.name){
                        missed = true;
                    }
                });

                if(missed){
                    warnings.push(ig.name+" cannot miss math two weeks in a row");
                } else {
                    warnings.push($scope.teachers[teacher].name + " has math");
                }
                
            }
        });
        
        //PE
        _.each(timeslot.PETeachers, function(teacher){
            if(ig.teachers.includes(teacher)){
                warnings.push($scope.teachers[teacher].name + " has PE");
            }
        });
        
        //Music
        _.each(timeslot.musicTeachers, function(teacher){
            if(ig.teachers.includes(teacher)){
                warnings.push($scope.teachers[teacher].name + " has music");
            }
        });
        
        //Art
        _.each(timeslot.artTeachers, function(teacher){
            if(ig.teachers.includes(teacher)){
                warnings.push($scope.teachers[teacher].name + " has art");
            }
        });
        
        //Recess
        _.each(timeslot.recessTeachers, function(teacher){
            if(teachers.includes(teacher)){
                warnings.push($scope.teachers[teacher].name + " has recess");
            }
        });

        return warnings.join('; ');
    }
    
    $scope.groupsAvailable = function(timeslot){
    	var free = []
    	var recess = []
    	var math = []
    	var pe = []
    	var music = []

    	//Recess
    	if(timeslot && timeslot.recessTeachers !== undefined){
    		_.each($scope.school.instrumentGroups, function(ig){
    			var groupFree = true;
    			_.each(timeslot.recessTeachers, function(teacher){
    				_.each(ig.teachers, function(igTeacher){
    					if(teacher === igTeacher){
    						groupFree = false;
    					}
    				});
    			});
    			
    			if(!groupFree){
    				recess.push(ig.name)
    			}
    		});
    	}
    	//Math
    	if(timeslot && timeslot.mathTeachers !== undefined){
    		_.each($scope.school.instrumentGroups, function(ig){
    			var groupFree = true;
    			_.each(timeslot.mathTeachers, function(teacher){
    				_.each(ig.teachers, function(igTeacher){
    					if(teacher === igTeacher){
    						groupFree = false;
    					}
    				});
    			});
    			
    			if(!groupFree && !recess.includes(ig.name)){
    				math.push(ig.name)
    			}
    		});
    	}
    	//PE
    	if(timeslot && timeslot.PETeachers !== undefined){
    		_.each($scope.school.instrumentGroups, function(ig){
    			var groupFree = true;
    			_.each(timeslot.PETeachers, function(teacher){
    				_.each(ig.teachers, function(igTeacher){
    					if(teacher === igTeacher){
    						groupFree = false;
    					}
    				});
    			});
    			
    			if(!groupFree && !recess.includes(ig.name) && !math.includes(ig.name)){
    				pe.push(ig.name)
    			}
    		});
    	}
    	//Music
    	if(timeslot && timeslot.musicTeachers !== undefined){
    		_.each($scope.school.instrumentGroups, function(ig){
    			var groupFree = true;
    			_.each(timeslot.musicTeachers, function(teacher){
    				_.each(ig.teachers, function(igTeacher){
    					if(teacher === igTeacher){
    						groupFree = false;
    					}
    				});
    			});
    			
    			if(!groupFree && !recess.includes(ig.name) && !math.includes(ig.name) && !pe.includes(ig.name)){
    				music.push(ig.name)
    			}
    		});
    	}
    	//Free
    	if(timeslot && timeslot.musicTeachers !== undefined){
    		_.each($scope.school.instrumentGroups, function(ig){
    			if(!recess.includes(ig.name) && !math.includes(ig.name) && !pe.includes(ig.name) && !music.includes(ig.name)){
    				free.push(ig.name)
    			}
    		});
    	}
    	
    	return {'free': free, 'music': music, 'pe': pe, 'math': math, 'recess': recess}
    }

    $scope.openTimeslot = function(day, timeslot, instrumentGroup){
    	var green = 1;
    	var blue = 2;
    	var orange = 3;
    	var lightRed = 4;
    	var red = 5;
    	
    	if(day && timeslot && instrumentGroup && instrumentGroup.teachers !== undefined){
    		//If group is in recess, mark it as red
    		var returnColor = false;
    		_.each($scope.school.instrumentGroups[instrumentGroup.id].teachers, function(teacher){
	    		if($scope.school.schedule[day].timeslots[timeslot.startTime].recessTeachers.includes(teacher)){
	    			returnColor = true;
	    		}
    		});
    		if(returnColor){
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
    		returnColor = false;
    		_.each(_.keys($scope.computedSchedule), function(scheduleSlot){
    			if(!scheduleSlot.includes(timeslot.startTime) && scheduleSlot.includes(day)){
    				if($scope.computedSchedule[scheduleSlot][instrumentGroup.name])
    					returnColor = true;
    			}
    		});
    		if(returnColor)
    			return red;
    		
    		//If this group has already met at this time this week, mark them as red
    		returnColor = false;
    		_.each(_.keys($scope.computedSchedule), function(scheduleSlot){
    			if(scheduleSlot.includes(timeslot.startTime) && !scheduleSlot.includes(day)){
    				if($scope.computedSchedule[scheduleSlot][instrumentGroup.name])
    					returnColor = true;
    			}
    		});
    		if(returnColor){
    			return red;
    		}
    		
    		//If this group is in math, assign light red
    		_.each($scope.school.instrumentGroups[instrumentGroup.id].teachers, function(teacher){
	    		if($scope.school.schedule[day].timeslots[timeslot.startTime].mathTeachers.includes(teacher)){
	    			returnColor = true;
	    		}
    		});
    		if(returnColor){
    			return lightRed
    		}
    		
    		//If this group is in PE, assign orange
    		_.each($scope.school.instrumentGroups[instrumentGroup.id].teachers, function(teacher){
	    		if($scope.school.schedule[day].timeslots[timeslot.startTime].PETeachers.includes(teacher)){
	    			returnColor = true;
	    		}
    		});
    		if(returnColor){
    			return orange
    		}
    		
    		//If this group is in music or art, assign blue
    		_.each($scope.school.instrumentGroups[instrumentGroup.id].teachers, function(teacher){
	    		if($scope.school.schedule[day].timeslots[timeslot.startTime].musicTeachers.includes(teacher)){
	    			returnColor = true;
	    		}
	    		if($scope.school.schedule[day].timeslots[timeslot.startTime].artTeachers.includes(teacher)){
	    			returnColor = true;
	    		}
    		});
    		if(returnColor){
    			return blue
    		}
    		
    		//Otherwise, return green
    		return green;
    	}
    	
    	//If we don't know enough about the timeslot.group, mark it as red
		return red;
    }
    
    $scope.toggleSchedule = function(subject, teacherKey){
    	var idx = subject.indexOf(teacherKey);
    	if(idx > -1){
    		subject.splice(idx, 1);
    	} else{
    		subject.push(teacherKey);
    	}
    }

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
    /*
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
    */

    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    //Create clipboard button listener
    //new ClipboardJS('.btn');

    //Watch for school change
    $scope.$watch('school', function(){
        //Change teachers
    	$scope.teachers = $scope.school.name.includes('Woodmore') ? 
            JSON.parse(JSON.stringify(teacherData__W)) : 
            JSON.parse(JSON.stringify(teacherData__TG)); 

        //Toggle new default days
        _.each(_.keys($scope.school.schedule), function(day){
            $scope.days[day] = $scope.school.schedule[day].defaultActive;
        });
        
        //TODO do missed math
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

