import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react'; // the AG Grid React Component
import httpRequest from '~/utils/htppRequest';
import { useForm } from 'react-hook-form';
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import { useNavigate } from 'react-router-dom';
const DEVICE_URL = '/device/list-by-current-user';
const REQUEST_URL = '/warrantycard/require';
function DeviceByUsers() {
    const gridRef = useRef(); // Optional - for accessing Grid's API
    const [rowData, setRowData] = useState([]); // Set rowData to Array of Objects, one Object per Row
    const navigate = useNavigate();
    const tenVien = localStorage.getItem('tenVien');
    const tenPhong = localStorage.getItem('tenPhong');
    const tenBan = localStorage.getItem('tenBan');
    const [isOpenRequestPage, setIsOpenRequestPage] = useState(false);
    const [dataRequest, setDataRequest] = useState([]);
    const columnDefs = useMemo(
        () => [
            { field: 'name', headerName: 'TÊN THIẾT BỊ', filter: true },
            { field: 'serial', headerName: 'SERIAL', filter: true },
            { field: 'price', headerName: 'Giá tiền' },
            { field: 'warrantyTime', headerName: 'Thời hạn bảo hành', filter: true },
            { field: 'maintenanceTime', headerName: 'Chu kì bảo trì', filter: true },
            { field: 'status', headerName: 'Trạng thái xuất', filter: true },
            { field: 'warrantyStatus', headerName: 'Trạng thái bảo hành', filter: true },
            { field: 'maintenanceStatus', headerName: 'Trạng thái bảo trì', filter: true },
        ],
        [],
    );
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();
    const defaultColDef = useMemo(
        () => ({
            sortable: true,
        }),
        [],
    );
    const cellClickedListener = useCallback((event) => {
        console.log('cellClicked', event);
    }, []);

    const rowClickedListener = useCallback((event) => {
        console.log('rowClicked', event);
    }, []);
    useEffect(() => {
        httpRequest
            .get(DEVICE_URL, { withCredentials: true })
            .then((response) => {
                const data = response.data; // Assuming the response is an array of objects
                setRowData(data);
                console.log(data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);
    useEffect(() => {
        const handleContextMenu = (event) => {
            event.preventDefault(); // Ngăn chặn hiển thị hộp thoại mặc định của trình duyệt
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);
    const cellContextMenuListener = useCallback((params) => {
        params.event.preventDefault();
        const selectedRow = params.node.data;
        const dataResponse = selectedRow;
        const options = {
            request: {
                name: 'Yêu cầu bảo hành',
                action: () => handleRequest(dataResponse),
            },
        };
        if (dataResponse.status === 'DA_XUAT') {
            delete options.export;
        }
        showContextMenu(params.event.clientX, params.event.clientY, options);
    }, []);
    const showContextMenu = (clientX, clientY, options) => {
        const contextMenuDiv = document.createElement('div');
        contextMenuDiv.id = 'customContextMenu';
        contextMenuDiv.style.position = 'absolute';
        contextMenuDiv.style.left = `${clientX}px`;
        contextMenuDiv.style.top = `${clientY}px`;
        contextMenuDiv.style.backgroundColor = 'white';
        contextMenuDiv.style.padding = '5px';
        contextMenuDiv.style.boxShadow = '2px 2px 10px rgba(0, 0, 0, 0.2)';
        contextMenuDiv.style.zIndex = '999';

        for (const key in options) {
            const menuItem = document.createElement('div');
            menuItem.innerText = options[key].name;
            menuItem.style.cursor = 'pointer';
            menuItem.style.padding = '5px 10px';

            menuItem.addEventListener('click', () => {
                options[key].action();
                document.removeEventListener('click', handleDocumentClick);
                document.body.removeChild(contextMenuDiv);
            });

            contextMenuDiv.appendChild(menuItem);
        }

        document.body.appendChild(contextMenuDiv);

        const handleDocumentClick = (event) => {
            if (!contextMenuDiv.contains(event.target)) {
                document.removeEventListener('click', handleDocumentClick);
                document.body.removeChild(contextMenuDiv);
            }
        };

        document.addEventListener('click', handleDocumentClick);
    };
    const handleRequest = (data) => {
        console.log(data);
        setIsOpenRequestPage(true);
        setDataRequest(data);
    };

    const handleCancel = () => {
        setIsOpenRequestPage(false);
    };

    const onSubmit = (data) => {
        console.log(data.note);
        console.log(dataRequest.serial);
        const dataSend = {
            note: data.note,
            serial: dataRequest.serial,
        };
        httpRequest
            .post(REQUEST_URL, dataSend, { withCredentials: true })
            .then((response) => {
                console.log(response.data);
                alert('Gửi thành công');
                setIsOpenRequestPage(false);
                reset();
            })
            .catch((err) => {
                console.log(err);
            });
    };
    return (
        <div>
            {!isOpenRequestPage ? (
                <div className="ag-theme-alpine" style={{ width: 1500, height: 500 }}>
                    <h1>
                        Danh sách thiết bị thuộc phòng {tenPhong}, ban {tenBan}, viện {tenVien}
                    </h1>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        animateRows={true}
                        onCellClicked={cellClickedListener}
                        onRowClicked={rowClickedListener}
                        onCellContextMenu={cellContextMenuListener}
                    />
                </div>
            ) : (
                <div>
                    <h1>
                        Yêu cầu bảo hành thiết bị {dataRequest.name}, serial {dataRequest.serial}
                    </h1>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <input
                            placeholder="Nhập yêu cầu bảo hành"
                            {...register('note', {
                                required: 'Vui lòng nhập yêu cầu bảo hành',
                            })}
                        />
                        <p>{errors.note?.message}</p>
                        <input type="submit" />
                    </form>
                    <button onClick={handleCancel}>Huỷ</button>
                </div>
            )}
        </div>
    );
}

export default DeviceByUsers;