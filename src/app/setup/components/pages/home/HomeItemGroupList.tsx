import * as React from "react";

export const HomeItemGroupList = (
    props: {
        title: string;
        items: string[];
        onCreateItem: (e: React.MouseEvent<HTMLButtonElement>) => void;
        onImportItemFromPC?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onImportItemFromExamples?: (e: React.MouseEvent<HTMLButtonElement>) => void;
        onDeleteItem?: (index: number) => void;
        getRunItemHref?: (index: number) => string;
        getEditItemHref?: (index: number) => string;
        getSelectItemHref?: (index: number) => string;
    }
) => {

    const items = props.items;

    return (
        <div className="box">
            <div className="level">
                <div className="level-left">
                    <h2 className="title is-4">{props.title}</h2>
                </div>
                <div className="level-right">
                    <button className="button is-primary" onClick={props.onCreateItem}>Create
                    </button>
                    <input type="file" name="import" accept=".bll" style={{display: 'none'}}
                           onChange={props.onImportItemFromPC}/>
                    <button className="button is-info" id="importButton"
                            onClick={(e) => {
                                (e.currentTarget.previousSibling as HTMLInputElement).click()
                            }}>
                        <span className="icon"><i className="fas fa-file-import"></i></span>
                        <span>Import by From PC</span>
                    </button>
                    <button className="button is-link ml-2" onClick={props.onImportItemFromExamples}>Import by Example
                    </button>
                </div>
            </div>
            <table className="table is-fullwidth is-striped">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {
                    items?.length <= 0 ? <tr>
                            <td>No Item Available</td>
                            <td></td>
                        </tr> :
                        items?.map((name, index) => {
                            return (
                                <tr key={index}>
                                    <td>{name}</td>
                                    <td>
                                        {props.getRunItemHref && (
                                            <a className="button is-small is-success"
                                               href={props.getRunItemHref(index)}>Run</a>
                                        )}
                                        {props.getSelectItemHref && (
                                            <a className="button is-small is-success"
                                               href={props.getSelectItemHref(index)}>Select</a>
                                        )}
                                        {props.getEditItemHref && (
                                            <a className="button is-small is-info"
                                               href={props.getEditItemHref(index)}>Edit</a>
                                        )}
                                        {props.onDeleteItem && (
                                            <button
                                                className="button is-small is-danger"
                                                onClick={() => props.onDeleteItem(index)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })
                }
                </tbody>
            </table>
        </div>
    );
};
