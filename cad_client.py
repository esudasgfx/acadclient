"""Reusable cross-CAD client built on pyRx.

This module provides a CadClient class for basic CRUD operations and
transformations against the active drawing database in pyRx-compatible hosts.
"""

from __future__ import annotations

from typing import Any

from pyrx import Ap, Db, Ed, Ge


class CadClient:
    """High-level helper for common CAD entity operations."""

    def __init__(self) -> None:
        """Initialize from the active document, database, and editor."""
        try:
            self.doc = self._get_active_document()
            self.db = self._get_document_database(self.doc)
            self.ed = self._get_document_editor(self.doc)
        except Exception as exc:
            raise RuntimeError(f"Failed to initialize CadClient: {exc}") from exc

    def write_message(self, message: str) -> None:
        """Write a message to the active editor output."""
        text = message if message.endswith("\n") else f"{message}\n"
        try:
            self.ed.writeMessage(text)
        except Exception:
            # Keep logging best-effort; avoid breaking callers on UI output issues.
            pass

    def add_line(self, start: Ge.Point3d, end: Ge.Point3d) -> Db.Line:
        """Create a line in model space and return the new line object."""
        try:
            with self.db.transaction() as tr:
                model_space = self._open_model_space(tr, Db.OpenMode.kForWrite)
                line = Db.Line(start, end)
                model_space.appendEntity(line)
                tr.addNewlyCreatedDBObject(line, True)
                return line
        except Exception as exc:
            self.write_message(f"Error creating line: {exc}")
            raise RuntimeError(f"add_line failed: {exc}") from exc

    def add_circle(self, center: Ge.Point3d, radius: float) -> Db.Circle:
        """Create a circle in model space and return the new circle object."""
        try:
            with self.db.transaction() as tr:
                model_space = self._open_model_space(tr, Db.OpenMode.kForWrite)
                circle = Db.Circle(center, Ge.Vector3d.kZAxis, float(radius))
                model_space.appendEntity(circle)
                tr.addNewlyCreatedDBObject(circle, True)
                return circle
        except Exception as exc:
            self.write_message(f"Error creating circle: {exc}")
            raise RuntimeError(f"add_circle failed: {exc}") from exc

    def add_text(self, text: str, position: Ge.Point3d, height: float) -> Db.MText:
        """Create MText in model space and return the new MText object."""
        try:
            with self.db.transaction() as tr:
                model_space = self._open_model_space(tr, Db.OpenMode.kForWrite)
                mtext = Db.MText()
                self._set_attr_or_call(mtext, ("setContents", "setText"), text)
                self._set_attr_or_call(mtext, ("setLocation", "setPosition"), position)
                self._set_attr_or_call(mtext, ("setTextHeight", "setHeight"), float(height))
                model_space.appendEntity(mtext)
                tr.addNewlyCreatedDBObject(mtext, True)
                return mtext
        except Exception as exc:
            self.write_message(f"Error creating text: {exc}")
            raise RuntimeError(f"add_text failed: {exc}") from exc

    def set_layer(self, layer_name: str, color_index: int) -> None:
        """Create layer if missing and set its color index."""
        try:
            with self.db.transaction() as tr:
                layer_table = tr.getObject(self.db.layerTableId(), Db.OpenMode.kForWrite)
                layer_id = self._layer_id_if_exists(layer_table, layer_name)

                if layer_id is None:
                    layer_record = Db.LayerTableRecord()
                    self._set_attr_or_call(layer_record, ("setName",), layer_name)
                    layer_id = layer_table.add(layer_record)
                    tr.addNewlyCreatedDBObject(layer_record, True)

                layer = tr.getObject(layer_id, Db.OpenMode.kForWrite)
                self._set_entity_color_index(layer, int(color_index))
        except Exception as exc:
            self.write_message(f"Error setting layer '{layer_name}': {exc}")
            raise RuntimeError(f"set_layer failed: {exc}") from exc

    def select_all(self) -> list[Db.ObjectId]:
        """Return ObjectIds of all entities in model space."""
        try:
            return self._select([])
        except Exception as exc:
            self.write_message(f"Error selecting all entities: {exc}")
            raise RuntimeError(f"select_all failed: {exc}") from exc

    def select_by_type(self, dxf_name: str) -> list[Db.ObjectId]:
        """Return ObjectIds for entities matching a DXF name (e.g. LINE)."""
        try:
            return self._select([(0, str(dxf_name).upper())])
        except Exception as exc:
            self.write_message(f"Error selecting by type '{dxf_name}': {exc}")
            raise RuntimeError(f"select_by_type failed: {exc}") from exc

    def select_by_layer(self, layer_name: str) -> list[Db.ObjectId]:
        """Return ObjectIds for entities on a given layer name."""
        try:
            return self._select([(8, str(layer_name))])
        except Exception as exc:
            self.write_message(f"Error selecting by layer '{layer_name}': {exc}")
            raise RuntimeError(f"select_by_layer failed: {exc}") from exc

    def select_by_properties(self, filters: dict) -> list[Db.ObjectId]:
        """Return ObjectIds matching a DXF-code filter dictionary."""
        try:
            filter_list = list(filters.items())
            return self._select(filter_list)
        except Exception as exc:
            self.write_message(f"Error selecting by properties {filters}: {exc}")
            raise RuntimeError(f"select_by_properties failed: {exc}") from exc

    def get_entity_by_id(self, obj_id: Db.ObjectId) -> Db.Entity:
        """Open and return an entity for read."""
        try:
            return Db.Entity(obj_id, Db.OpenMode.kForRead)
        except Exception as exc:
            self.write_message(f"Error opening entity {obj_id}: {exc}")
            raise RuntimeError(f"get_entity_by_id failed: {exc}") from exc

    def delete_entity(self, obj_id: Db.ObjectId) -> bool:
        """Erase an entity by ObjectId and return success."""
        try:
            with self.db.transaction() as tr:
                entity = tr.getObject(obj_id, Db.OpenMode.kForWrite)
                entity.erase()
            return True
        except Exception as exc:
            self.write_message(f"Error deleting entity {obj_id}: {exc}")
            raise RuntimeError(f"delete_entity failed: {exc}") from exc

    def move_entity(self, obj_id: Db.ObjectId, displacement: Ge.Vector3d) -> bool:
        """Move an entity by a displacement vector and return success."""
        try:
            with self.db.transaction() as tr:
                entity = tr.getObject(obj_id, Db.OpenMode.kForWrite)
                entity.transformBy(self._translation_matrix(displacement))
            return True
        except Exception as exc:
            self.write_message(f"Error moving entity {obj_id}: {exc}")
            raise RuntimeError(f"move_entity failed: {exc}") from exc

    def copy_entity(self, obj_id: Db.ObjectId) -> Db.ObjectId:
        """Clone an entity, append it to its owner/model space, return new ObjectId."""
        try:
            with self.db.transaction() as tr:
                source = tr.getObject(obj_id, Db.OpenMode.kForRead)
                cloned = source.clone()

                owner = self._open_owner_or_modelspace_for_write(tr, source)
                new_id = owner.appendEntity(cloned)
                tr.addNewlyCreatedDBObject(cloned, True)
                return new_id
        except Exception as exc:
            self.write_message(f"Error copying entity {obj_id}: {exc}")
            raise RuntimeError(f"copy_entity failed: {exc}") from exc

    def mirror_entity(
        self,
        obj_id: Db.ObjectId,
        line_point1: Ge.Point3d,
        line_point2: Ge.Point3d,
    ) -> Db.ObjectId:
        """Mirror an entity about a line and return the new mirrored ObjectId."""
        try:
            with self.db.transaction() as tr:
                source = tr.getObject(obj_id, Db.OpenMode.kForRead)
                mirrored = source.clone()
                mirror_axis = Ge.Line3d(line_point1, line_point2)
                mirror_xform = Ge.Matrix3d.mirroring(mirror_axis)
                mirrored.transformBy(mirror_xform)

                owner = self._open_owner_or_modelspace_for_write(tr, source)
                new_id = owner.appendEntity(mirrored)
                tr.addNewlyCreatedDBObject(mirrored, True)
                return new_id
        except Exception as exc:
            self.write_message(f"Error mirroring entity {obj_id}: {exc}")
            raise RuntimeError(f"mirror_entity failed: {exc}") from exc

    def _select(self, filter_list: list[tuple[int, Any]]) -> list[Db.ObjectId]:
        """Internal selection helper using DXF-style filter pairs."""
        results: list[Db.ObjectId] = []
        with self.db.transaction() as tr:
            model_space = self._open_model_space(tr, Db.OpenMode.kForRead)
            for obj_id in model_space:
                try:
                    entity = tr.getObject(obj_id, Db.OpenMode.kForRead)
                except Exception:
                    continue
                if self._entity_matches_filters(entity, filter_list):
                    results.append(obj_id)
        return results

    @staticmethod
    def _set_attr_or_call(obj: Any, names: tuple[str, ...], value: Any) -> None:
        for name in names:
            if not hasattr(obj, name):
                continue
            member = getattr(obj, name)
            if callable(member):
                member(value)
                return
            setattr(obj, name, value)
            return
        raise AttributeError(f"None of attributes/methods found: {names}")

    @staticmethod
    def _get_active_document() -> Any:
        if hasattr(Ap, "curDoc") and callable(getattr(Ap, "curDoc")):
            doc = Ap.curDoc()
            if doc is not None:
                return doc

        if hasattr(Ap, "Application"):
            app = Ap.Application()
            if hasattr(app, "documentManager"):
                dm = app.documentManager()
                if hasattr(dm, "mdiActiveDocument"):
                    doc = dm.mdiActiveDocument()
                    if doc is not None:
                        return doc

        raise RuntimeError("Unable to resolve active document from Ap")

    @staticmethod
    def _get_document_database(doc: Any) -> Db.Database:
        for name in ("database", "db"):
            if not hasattr(doc, name):
                continue
            member = getattr(doc, name)
            return member() if callable(member) else member
        raise RuntimeError("Active document does not expose database")

    @staticmethod
    def _get_document_editor(doc: Any) -> Ed.Editor:
        for name in ("editor", "ed"):
            if not hasattr(doc, name):
                continue
            member = getattr(doc, name)
            return member() if callable(member) else member
        raise RuntimeError("Active document does not expose editor")

    def _open_model_space(self, tr: Any, mode: Db.OpenMode) -> Any:
        block_table = tr.getObject(self.db.blockTableId(), Db.OpenMode.kForRead)

        model_id = None
        if hasattr(block_table, "getAt"):
            model_id = block_table.getAt(Db.BlockTableRecord.ModelSpace)
        elif hasattr(block_table, "__getitem__"):
            model_id = block_table[Db.BlockTableRecord.ModelSpace]
        else:
            raise RuntimeError("Unsupported BlockTable API for ModelSpace lookup")

        return tr.getObject(model_id, mode)

    def _open_owner_or_modelspace_for_write(self, tr: Any, entity: Any) -> Any:
        owner_id = None
        for accessor in ("ownerId", "blockId"):
            if hasattr(entity, accessor):
                member = getattr(entity, accessor)
                owner_id = member() if callable(member) else member
                break

        if owner_id:
            try:
                return tr.getObject(owner_id, Db.OpenMode.kForWrite)
            except Exception:
                pass

        return self._open_model_space(tr, Db.OpenMode.kForWrite)

    @staticmethod
    def _entity_dxf_name(entity: Any) -> str | None:
        if hasattr(entity, "dxfName"):
            member = getattr(entity, "dxfName")
            return member() if callable(member) else member

        if hasattr(entity, "isA"):
            rx = entity.isA()
            if hasattr(rx, "dxfName"):
                dxf = rx.dxfName
                return dxf() if callable(dxf) else dxf

        return None

    @staticmethod
    def _entity_layer_name(entity: Any) -> str | None:
        if hasattr(entity, "layer"):
            member = getattr(entity, "layer")
            return member() if callable(member) else member
        return None

    @staticmethod
    def _entity_color_index(entity: Any) -> int | None:
        if hasattr(entity, "colorIndex"):
            member = getattr(entity, "colorIndex")
            value = member() if callable(member) else member
            return int(value)

        if hasattr(entity, "color"):
            color = entity.color() if callable(entity.color) else entity.color
            if hasattr(color, "colorIndex"):
                ci = color.colorIndex
                return int(ci() if callable(ci) else ci)

        return None

    def _entity_matches_filters(
        self, entity: Any, filter_list: list[tuple[int, Any]]
    ) -> bool:
        for code, value in filter_list:
            if code == 0:
                dxf = self._entity_dxf_name(entity)
                if dxf is None or str(dxf).upper() != str(value).upper():
                    return False
            elif code == 8:
                layer = self._entity_layer_name(entity)
                if layer is None or str(layer) != str(value):
                    return False
            elif code == 62:
                ci = self._entity_color_index(entity)
                if ci is None or int(ci) != int(value):
                    return False
            else:
                # Unknown/unsupported code for this lightweight implementation.
                return False
        return True

    @staticmethod
    def _translation_matrix(displacement: Ge.Vector3d) -> Ge.Matrix3d:
        if hasattr(Ge.Matrix3d, "translation"):
            return Ge.Matrix3d.translation(displacement)
        if hasattr(Ge.Matrix3d, "displacement"):
            return Ge.Matrix3d.displacement(displacement)
        matrix = Ge.Matrix3d()
        if hasattr(matrix, "setToTranslation"):
            matrix.setToTranslation(displacement)
            return matrix
        raise RuntimeError("No translation constructor found on Ge.Matrix3d")

    @staticmethod
    def _layer_id_if_exists(layer_table: Any, layer_name: str) -> Any:
        if hasattr(layer_table, "has") and layer_table.has(layer_name):
            if hasattr(layer_table, "getAt"):
                return layer_table.getAt(layer_name)
            if hasattr(layer_table, "__getitem__"):
                return layer_table[layer_name]
        return None

    @staticmethod
    def _set_entity_color_index(layer_record: Any, color_index: int) -> None:
        if hasattr(layer_record, "setColorIndex"):
            layer_record.setColorIndex(color_index)
            return

        # Fallback for APIs that expect a Db.Color object.
        if hasattr(Db, "Color"):
            color = Db.Color()
            if hasattr(color, "setColorIndex"):
                color.setColorIndex(color_index)
                if hasattr(layer_record, "setColor"):
                    layer_record.setColor(color)
                    return

        raise RuntimeError("Unable to set color index on layer record")


# Example usage (run inside a pyRx-enabled CAD session):
#
# from pyrx import Ge
# from cad_client import CadClient
#
# client = CadClient()
# client.set_layer("PYRX_DEMO", 1)
# ln = client.add_line(Ge.Point3d(0, 0, 0), Ge.Point3d(100, 0, 0))
# cid = client.copy_entity(ln.objectId())
# client.move_entity(cid, Ge.Vector3d(0, 50, 0))
