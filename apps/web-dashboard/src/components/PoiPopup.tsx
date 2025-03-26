import { Popup } from "@vis.gl/react-maplibre";
import { type ReactElement } from "react";

import type { RawPoi } from "../app/pois/types";

interface PoiPopupProps {
  popupInfo: {
    poi: RawPoi;
    longitude: number;
    latitude: number;
  };
  onClose: () => void;
}

const osmTypeToLink: Record<string, string> = {
  N: "node",
  W: "way",
  R: "relation",
};

export function PoiPopup({ popupInfo, onClose }: PoiPopupProps): ReactElement {
  const osmLink = `https://www.openstreetmap.org/${osmTypeToLink[popupInfo.poi.osm_type]}/${popupInfo.poi.osm_id}`;
  return (
    <Popup
      anchor="top"
      longitude={popupInfo.longitude}
      latitude={popupInfo.latitude}
      onClose={onClose}
    >
      <div className="max-w-sm p-1">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {popupInfo.poi.name}
          </h3>
          <p className="text-sm text-gray-600">
            ID:{" "}
            <a
              href={osmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600"
            >
              {popupInfo.poi.osm_type} {popupInfo.poi.osm_id}
            </a>
          </p>
          {popupInfo.poi.tags.wikidata && (
            <p className="text-sm text-gray-600">
              WikiData:{" "}
              <a
                href={`https://www.wikidata.org/wiki/${popupInfo.poi.tags.wikidata}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                {popupInfo.poi.tags.wikidata}
              </a>
            </p>
          )}
          {popupInfo.poi.tags.wikipedia && (
            <p className="text-sm text-gray-600">
              Wikipedia:{" "}
              <a
                href={`https://www.wikipedia.org/wiki/${popupInfo.poi.tags.wikipedia}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                {popupInfo.poi.tags.wikipedia}
              </a>
            </p>
          )}
          <p className="text-sm font-medium text-pink-500">
            {popupInfo.poi.class} - {popupInfo.poi.subclass}
          </p>
        </div>

        <div className="mb-3">
          <h4 className="mb-1 text-sm font-semibold text-gray-700">
            Localisation
          </h4>
          {/* <p className="text-sm text-gray-600">
            Commune:{" "}
            {popupInfo.poi.boundaries.find((b) => b.admin_level === "8")?.name ??
              ""}
          </p> */}
          <p className="text-sm text-gray-600">
            Coordonnées: {popupInfo.latitude.toFixed(6)},{" "}
            {popupInfo.longitude.toFixed(6)}
          </p>
        </div>

        <div>
          <h4 className="mb-1 text-sm font-semibold text-gray-700">Tags</h4>
          <table className="table-auto border-collapse">
            <tbody>
              {Object.entries(popupInfo.poi.tags).map(([k, v]) => (
                <tr key={k} className="border border-gray-300">
                  <td className="text-sm flex">{k}</td>
                  <td className="text-sm border">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Popup>
  );
}
