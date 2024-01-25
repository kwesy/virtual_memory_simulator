var sessionstart = false;
var TLBPageArray = new Array();
var TLBFrameArray = new Array();
var PageTableFrameArray = new Array();
var PageTableValidArray = new Array();
var PhysicalMemoryContentArray = new Array();
var TLB=0, physicalpage = 0;
var physicalpageBit, memoryBit;
var listOfInstructions = new Array();
var listOfInstructionsTF = new Array();
var counter = -1; // to track the TLB table
var physicalMemoryCounter = 0;
var memory =0, physicalMemoryRows = 0;
var pagetableHit = 0, TLBHit=0 , TLBHitBoolean=false, pagetableHitBoolean=false;
var pageTableRows = 0;
var step = 0

var binary; // To hold the binary form of the load instruction
var index;






///////////////////////////// SET UP CONFIGURATION////////////////////////////////////////

function updateTLBTable(numRowsToInit=0, init=false, row=0, values=[], reset=false){
    table = document.getElementById("TLB-tbody")

    if (reset) {
        table.innerHTML = ''
    }else if (init){
        table.innerHTML = ''
        for (i = 0; i< numRowsToInit; i++) { 
            table.innerHTML += `
                <tr id = 'TLB_row-${i}' >
                    <td>${i}</td>
                    <td>-</td>
                    <td>-</td>
                </tr>`
            }
    }else {
        tlbRow = document.getElementById(`TLB_row-${row}`)
        tlbRow.innerHTML = `
                <td>${row}</td>
                <td>${values[0]}</td>
                <td>${values[1]}</td>
            `
    }
	
	return;

}
function updatePageTable(numRowsToInit=0, init=false, row=0, values=[], reset=false){
	table = document.getElementById("page_table-tbody")
    if (reset) {
        table.innerHTML = ''
    }else if (init){
        table.innerHTML = ''
        for (i = 0; i< numRowsToInit; i++) { 
            table.innerHTML += `
                <tr id = 'page_table_row-${i}' >
                    <td>${i}</td>
                    <td>0</td>
                    <td>-</td>
                </tr>`
            }
    }else {
        tablepageRow = document.getElementById(`page_table_row-${row}`)
        tablepageRow.innerHTML = `
                <td>${row}</td>
                <td>${values[0]}</td>
                <td>${values[1]}</td>
            `
    }
	
	return;
}

function updatePhysicalMemTable(numRowsToInit=0, init=false, page=0, content='-', reset=false){
	table = document.getElementById("physical_mem-tbody")
    if (reset) {
        table.innerHTML = ''
    }else if (init){
        table.innerHTML = ''
        for (i = 0; i< numRowsToInit; i++) { 
            table.innerHTML += `
                <tr id = 'physical_mem_row-${i}' >
                    <td>${i.toString(16).toUpperCase()}</td>
                    <td id=physical_mem_data-${i}>-</td>
                </tr>`
            }
        console.log('init Ram')
    }else {
        console.log('updating Ram', content)
        document.getElementById(`physical_mem_data-${page}`).innerText = content
    }
	
}

function updateInfoScreen (message, backgroundColor) {
    screen = document.getElementById('info')
    screen.innerText = message
    if (backgroundColor) screen.style.backgroundColor = backgroundColor
}

function updateAnalysisInfo(){
    document.getElementById('hitrate').innerText = hitRate;
    document.getElementById('missrate').innerText = missRate
}

function initAllTables(){

    updateTLBTable(numRowsToInit=TLB, init=true);
    updatePageTable(numRowsToInit=pageTableRows, init=true);
    updatePhysicalMemTable(numRowsToInit=physicalMemoryRows, init=true);
    
    //CONFIGURATION
    document.getElementById("ibindexbit").innerHTML="index ("+ (memoryBit-offsetBit) + " bit)";
    document.getElementById("iboffsetbit").innerHTML="offset ("+ offsetBit + " bit)";	
    document.getElementById('pagesize').disabled = true;
    document.getElementById('offsetsize').disabled = true;
    document.getElementById('virtualmemsize').disabled = true;
    document.getElementById('TLBsize').disabled = true;
    
    }




function loadConfiguration(){

sessionstart = true;
physicalpage = parseInt(document.getElementById('pagesize').value);
offsetBit = parseInt(document.getElementById('offsetsize').value);
offset = Math.pow(2,offsetBit);
memory = parseInt(document.getElementById('virtualmemsize').value);
TLB = parseInt(document.getElementById('TLBsize').value);
if ((isPowerOfTwo(physicalpage) == false)) { alert ("Cache, Memory must be in power of two");}
else
{
    physicalpageBit = log2(physicalpage);
    memoryBit = log2(memory);

    if ((physicalpageBit>=0))
    {

        pageTableRows = memory/offset;
        physicalMemoryRows = physicalpage/offset;
        
        
        TLBFrameArray = initialiseHypenArray(TLB);
        TLBPageArray = initialiseHypenArray(TLB);

        PageTableValidArray = initialiseZeroArray(pageTableRows);
        PageTableFrameArray = initialiseHypenArray(pageTableRows);

        PhysicalMemoryContentArray = initialiseHypenArray(physicalMemoryRows);
        // canvasHeight = pageTableRows*25 + TLB *25 + 500;
        // document.getElementById("canvas").style.height= canvasHeight+'px';
        initAllTables();
        document.getElementById('submitconfig').disabled = true;
        updateInfoScreen(`
        Instruction Length = log2(${memory}) = ${memoryBit} bits
        Physical Page Rows = ${physicalpage} / 2^${offsetBit} = ${physicalMemoryRows} rows
        Page Table Rows = ${memory} / 2^${offsetBit} = ${pageTableRows} rows
        TLB Rows= ${TLB} rows
        `);	
        
    }
    else{
        alert("Configuration is not valid. Please try again. \n Memory Size must be bigger than the total of Cache and Offset Size")
    }
}
}

function loadInstruction(){
if (sessionstart)
{
    let hex = document.getElementById('ld-inp').value;
    if (hex=="")
        {
            alert("Invalid Instruction")
        }
    binary = parseInt(hex,16).toString(2);
    index = binary.slice(0, -offsetBit)
    let prefix = "0".repeat(memoryBit-offsetBit - index.length)  // calculating the number of zeros to prefix the index
    console.log(prefix)
    index = prefix + index
    let instructionInt = parseInt(hex,16).toString(10);

    
    if (instructionInt<0 || instructionInt>(memory-1) ||isNaN(instructionInt))
    {
        document.getElementById('ld-inp').value = 0;
        alert("Instruction is not valid. Please try again");
    }
    else{

        document.getElementById('ibindexbit').innerText = "index ("+ (memoryBit-offsetBit) +" bit)"
        document.getElementById('iboffsetbit').innerText = "offset ("+ offsetBit +" bit)" 
        document.getElementById('indexbit').innerText = index
        document.getElementById('offsetbit').innerText = binary.slice(-offsetBit)
        document.getElementById("ctrl_btns").innerHTML = `
        <button id="next_btn" onclick="runInstruction()">Next</button>
        <button id="next_btn">Fast Foward</button>
        `
        //Start the simulation
        step = 0;
        document.getElementById('ld-inp').disabled = true;
        document.getElementById('ld-btn').disabled = true;	
        TLBHitBoolean=false;
        pagetableHitBoolean=false;
        // Run frist step 
        listOfInstructions.push(hex);
        runInstruction()
        // loadInformation();
    }
}
else
{
    alert ("Please Specify Cache Configuration First!");
}
}
//-------------------------------------------------------------

// function loadInformation()
// {	
// // screen.scroll(0,0);	
// var indexOfPageTLB = TLBPageArray.indexOf((document.getElementById("ibindexbit").value));
// var pageTableIndex = parseInt(document.getElementById("ibindexbit").value,2) ;
// var canvasXY = document.getElementById("canvas").getBoundingClientRect();
// var markerTLB = "markerTLB"+(counter+1)%TLB;
// var topMargin =document.getElementById("addressevaluated").getBoundingClientRect().top - 10;

// if (document.getElementById("ld-inp").disabled==false)
// {
//     alert("Please submit the Load Instruction");
// }
// else{
//     step = executeVMInstruction (step);
    

// }
// }
function resetConfiguration(){
	// document.getElementById('pagesize').disabled = false;
	// document.getElementById('offsetsize').disabled = false;	
	// document.getElementById('virtualmemsize').disabled = false;		
	// document.getElementById('TLBsize').disabled = false;
	// document.getElementById('submitconfig').disabled = false;
	// document.getElementById('ld-inp').disabled = false;
	// document.getElementById('ld-btn').disabled = false;	
	location.reload();
	}
////////////////////////// END OF SET UP CONFIGURATION//////////////////////////////////////////////////




function runInstruction(){
    console.log(step)
    //Check index is in the TLB
    var indexOfPageTLB = TLBPageArray.indexOf(index);

    //converting the index part to integer.
    var pageTableIndex = parseInt(index,2) ;

    var canvasXY = document.getElementById("canvas").getBoundingClientRect();
    // var markerTLB = "markerTLB"+(counter+1)%TLB;
    var topMargin =document.getElementById("ib").getBoundingClientRect().top - 10;
    
    if (step==0){		
        updateInfoScreen("The instruction has been converted from hex to binary and allocated to index, and offset respectively", backgroundColor=null);
        // document.getElementById("next").disabled=false;
        // document.getElementById("fastforward").disabled=false;
        // document.getElementById(markerTLB).style.backgroundColor="blue";
        step++;
    }
    else if (step==1){	
        window.scroll(0,0);
        updateInfoScreen("Index requested has been searched in whole TLB", backgroundColor="Yellow");
        document.getElementById("indexbit").style.backgroundColor ="yellow";
        var indexXY = document.getElementById("indexbit").getBoundingClientRect();

        var indexMid = 0.5*((indexXY.right + indexXY.left)/2 - canvasXY.left);
        var TLBXY = document.getElementById("TLB").getBoundingClientRect();
        arrowcache = "<svg width = 100% height=100%>";
        for (x = 1; x <= TLB; x++) { 
            var TLBrow = document.getElementById(("TLB_row-"+(x-1))).getBoundingClientRect().top - canvasXY.top+10;

            var path = "M "+indexMid+","+topMargin+" V "+ TLBrow + " H "+ (TLBXY.left - canvasXY.left);

            arrowcache += "<path d='"+path+"' stroke='red' stroke-width='1.25' fill='none'/>";		
        }
        document.getElementById("canvas").innerHTML = arrowcache+"</svg>";
        step++;
    }
        
    else if (step==2){
        if (indexOfPageTLB== -1)
        {
            updateInfoScreen("There is no valid page in TLB.", "#F0CCCC");
            if (counter < (TLB-1))
            {counter++;}
            else
            {counter=0;}
            
        }
        else
        {
            window.scroll(0,0);
            updateInfoScreen("Valid page is found in the TLB. Frame and Offset is updated.", "#55F055");				
            document.getElementById(("TLB_row-"+indexOfPageTLB)).style.backgroundColor ="yellow";	
            document.getElementById("midbox_frame").innerHTML = TLBFrameArray[indexOfPageTLB] ;			
            document.getElementById("midbox_offset").innerHTML = binary.slice(-offset) ;
            document.getElementById("midbox_frame").style.backgroundColor = "yellow";			
            document.getElementById("midbox_offset").style.backgroundColor = "green";		
            // var TLBFrameArraySelectedXY = document.getElementById(("tlbpage"+indexOfPageTLB)).getBoundingClientRect();
            var TLBFrameArraySelectedXY = document.getElementById(("TLB_row-"+indexOfPageTLB)).lastElementChild.getBoundingClientRect();
            var OffsetRequestedXY = document.getElementById(("offsetbit")).getBoundingClientRect();
            var MiddleBoxFrameXY = document.getElementById(("midbox_frame")).getBoundingClientRect();
            var physicalMemoryXY = document.getElementById(("physical_mem_row-"+TLBFrameArray[indexOfPageTLB])).getBoundingClientRect();
            var TLBTableXY = document.getElementById("TLB").getBoundingClientRect();
            //LINE FROM SELECTED TLB TO MIDDLEBOX_FRAME
            var path = "M "+(0.9*(0.5*(TLBFrameArraySelectedXY.left+TLBFrameArraySelectedXY.right)- canvasXY.left))
                            +","+(TLBFrameArraySelectedXY.bottom-canvasXY.top)+" V "+(TLBTableXY.bottom-canvasXY.top+20);
            arrowcache += "<path d='"+path+"' stroke='green' stroke-width='1.25' fill='none'/>";		
            
            //LINE FROM OFFSET TO MIDDLEBOX_OFFSET
            var path = "M "+(1.1*(0.5*(OffsetRequestedXY.left+OffsetRequestedXY.right)- canvasXY.left))+","+topMargin+" V "+(TLBTableXY.bottom-canvasXY.top+20);
            arrowcache += "<path d='"+path+"' stroke='red' stroke-width='1.25' fill='none'/>";				

            
            document.getElementById(("physical_mem_row-"+TLBFrameArray[indexOfPageTLB])).style.backgroundColor = "yellow";
            document.getElementById("offsetbit").style.backgroundColor="green";
            
            TLBHitBoolean = true;
            TLBHit++;
            document.getElementById("canvas").innerHTML = arrowcache+"</svg>";

        }	
        

        step++;
    }	
    else if (step==3){
        if (!TLBHitBoolean){
            updateInfoScreen("Page is continue to be searched in Page Table.");
            var indexXY = document.getElementById("ibindexbit").getBoundingClientRect();
            var indexMid = 0.05*((indexXY.right + indexXY.left)/2 - canvasXY.left);
            var pageTableXY = document.getElementById(("page_table_row-"+pageTableIndex)).getBoundingClientRect();
            window.scroll(0,(pageTableXY.top-180));
            var path = "M "+100+","+topMargin+" H "+indexMid+" V "+ ((pageTableXY.top-canvasXY.top+5)) + " H "+ (pageTableXY.left-canvasXY.left);
            arrowcache += "<path d='"+path+"' stroke='red' stroke-width='1.25' fill='none'/>";		

            document.getElementById(("page_table_row-"+pageTableIndex)).style.backgroundColor ="blue";	
        }
        else{
            updateInfoScreen("Frame and Offset is obtained through physical memory.", "#55F055");
            //LINE FROM MIDDLEBOX_FRAME TO PHYSICAL MEMORY
            


            var MiddleBoxFrameXY = document.getElementById(("midbox_frame")).getBoundingClientRect();
            var physicalMemoryXY = document.getElementById(("physical_mem_row-"+TLBFrameArray[indexOfPageTLB])).getBoundingClientRect();
            var TLBTableXY = document.getElementById("TLB").getBoundingClientRect();			

            var path = "M "+(0.97*(0.5*(MiddleBoxFrameXY.left+MiddleBoxFrameXY.right)- canvasXY.left))+","+
                        (MiddleBoxFrameXY.bottom - canvasXY.top) +" V "+(physicalMemoryXY.top-canvasXY.top+10)+" H "+ (physicalMemoryXY.left-canvasXY.left+20);
            arrowcache += "<path d='"+path+"' stroke='black' stroke-width='1.25' fill='none'/>";
            step = 100;			
        }	
        document.getElementById("canvas").innerHTML = arrowcache+"</svg>";

        step++;
    }
    else if (step==4)
    {
        if (PageTableValidArray[pageTableIndex]==0)
        {
            updateInfoScreen("Page requested is not found in Page Table. Data will be loaded from Secondary Memory. TLB, Page Table and Physical Memory is updated accordingly", "#F0CCCC");	
            TLBPageArray[counter]= index
            var indexToTLBFrameArray = (physicalMemoryCounter%TLB);
            TLBFrameArray[counter] =indexToTLBFrameArray; 

            PageTableValidArray[pageTableIndex]=1;
            PageTableFrameArray[pageTableIndex]= physicalMemoryCounter;

            // PhysicalMemoryContentArray[physicalMemoryCounter] = "Block "+document.getElementById("ibindexbit").value+" Words : 0 - " + (offset-1) ;
            PhysicalMemoryContentArray[physicalMemoryCounter] = "Block "+index+" Words : 0 - " + (offset-1) ;
            updateTLBTable(0, false, row=counter, [index, physicalMemoryCounter]);	
            updatePhysicalMemTable(0, false, physicalMemoryCounter, PhysicalMemoryContentArray[physicalMemoryCounter])
            updatePageTable(0, false, pageTableIndex, [PageTableValidArray[pageTableIndex], PageTableFrameArray[pageTableIndex]])
            physicalMemoryCounter = (physicalMemoryCounter+1) %physicalMemoryRows;
        
        
        }
        else{
            updateInfoScreen("Page requested is found in Page Table. Let's fetch the data from Physical Memory. Page is updated in TLB as well.", "#F09999");
            document.getElementById(("page_table_row-"+pageTableIndex)).style.backgroundColor ="blue";	
            document.getElementById(("physical_mem_row-"+PageTableFrameArray[pageTableIndex])).style.backgroundColor = "yellow";			
            pagetableHit++;
            pagetableHitBoolean = true;
            
            //UPDATE TLB AND MIDDLE BOX
            window.scroll(0,0);
            document.getElementById("midbox_frame").innerHTML =PageTableFrameArray[pageTableIndex] ;			
            document.getElementById("midbox_offset").innerHTML = document.getElementById("offset").value ;
            document.getElementById("midbox_frame").style.backgroundColor = "yellow";			
            document.getElementById("midbox_offset").style.backgroundColor = "yellow";		
            
            
            var PageTableFrameArraySelectedXY = document.getElementById(("page_table_row-"+pageTableIndex)).getBoundingClientRect();
            var OffsetRequestedXY = document.getElementById(("offset")).getBoundingClientRect();
            var MiddleBoxFrameXY = document.getElementById(("midbox_frame")).getBoundingClientRect();
            var physicalMemoryXY = document.getElementById(("physical_mem_row-"+PageTableFrameArray[pageTableIndex])).getBoundingClientRect();
            var TLBTableXY = document.getElementById("TLB").getBoundingClientRect();

            //LINE FROM SELECTED PAGE TABLE ROW TO MIDDLEBOX
            var path = "M "+(PageTableFrameArraySelectedXY.right - canvasXY.left -20)+" , "+ (PageTableFrameArraySelectedXY.top-canvasXY.top+5) + 
                    " H " + (PageTableFrameArraySelectedXY.right - canvasXY.left) +" V "+(TLBTableXY.bottom-canvasXY.top+5);
            arrowcache += "<path d='"+path+"' stroke='blue' stroke-width='1.25' fill='none'/>";
            
            //LINE FROM OFFSET TO MIDDLEBOX_OFFSET
            var path = "M "+(1.1*(0.5*(OffsetRequestedXY.left+OffsetRequestedXY.right)- canvasXY.left))+","+topMargin+" V "+(TLBTableXY.bottom-canvasXY.top+20);
            arrowcache += "<path d='"+path+"' stroke='red' stroke-width='1.25' fill='none'/>";				
            document.getElementById("offset").style.backgroundColor="yellow";			

            
            //LINE FROM MIDDLEBOX_FRAME TO PHYSICAL MEMORY
            var path = "M "+(0.97*(0.5*(MiddleBoxFrameXY.left+MiddleBoxFrameXY.right)- canvasXY.left))+","+
                        (MiddleBoxFrameXY.bottom - canvasXY.top) +" V "+(physicalMemoryXY.top-canvasXY.top+10)+" H "+ (physicalMemoryXY.left-canvasXY.left+20);
            arrowcache += "<path d='"+path+"' stroke='orange' stroke-width='1.25' fill='none'/>";			
            document.getElementById("canvas").innerHTML = arrowcache+"</svg>";
            
            TLBPageArray[counter]= document.getElementById("ibindexbit").value;
            TLBFrameArray[counter] =PageTableFrameArray[pageTableIndex]; 
            document.getElementById("TLB").innerHTML = loadVMTLBTable();
            document.getElementById(("TLB_row-"+counter)).style.backgroundColor ="yellow";
        }

        step++;
    }
    else{
        window.scroll(0,0);
        updateInfoScreen("The cycle has been completed. Please submit another instructions", "");
        document.getElementById("canvas").innerHTML ="";
        document.getElementById('ld-inp').disabled = false;
        document.getElementById('ld-btn').disabled = false;	
        document.getElementById(("page_table_row-"+pageTableIndex)).style.backgroundColor ="";	
        if (indexOfPageTLB!=-1){
            console.log (TLBFrameArray);
            console.log(indexOfPageTLB);
            document.getElementById(("physical_mem_row-"+TLBFrameArray[indexOfPageTLB])).style.backgroundColor = "";
            document.getElementById(("TLB_row-"+indexOfPageTLB)).style.backgroundColor ="";			
        }

        resetColouring();
        if (TLBHitBoolean)
            listOfInstructionsTF.push ("TLB Hit")
        else if (pagetableHitBoolean)
            listOfInstructionsTF.push ("Page Table Hit");
        else listOfInstructionsTF.push ("Miss");
        
        var listofPrevIns="<ul>";
        for (p=0;p<listOfInstructions.length;p++)
        {

            listofPrevIns +="<li> "+listOfInstructions[p].toUpperCase()+" [" + listOfInstructionsTF[p]+"] </li>"; 
        }
        listofPrevIns +="</ul>";
        document.getElementById('list_of_prev_instructions').innerHTML = listofPrevIns;
        var hitRate = (TLBHit+pagetableHit) / listOfInstructions.length;
        console.log(TLBHit, pagetableHit, listOfInstructions)
        document.getElementById('hitrate').innerHTML= "Hit rate: " + Math.round(hitRate*100,2) +"%";
        document.getElementById('missrate').innerHTML= "Miss rate: " + Math.round((1 - hitRate)*100,2) + "%" ;
        
        step=-1;
    }
    
    }